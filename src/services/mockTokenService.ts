import type {
  EntryLog,
  Payment,
  RequestTokenData,
  TokenHistoryEntry,
  TokenRequest,
  TokenStatus,
  User,
} from '@/types';
import { EXTRA_TOKEN_FEE, FREE_TOKEN_LIMIT, INTERNAL_ROLES } from '@/config/constants';
import { generateId, getDB, newTokenId, persist } from '@/data/mockStore';

function addHistory(
  db: ReturnType<typeof getDB>,
  token_id: string,
  user_id: string,
  action: string,
  action_by: string,
): void {
  const entry: TokenHistoryEntry = {
    id: generateId('h'),
    token_id,
    user_id,
    action,
    action_by,
    timestamp: new Date().toISOString(),
  };
  db.tokenHistory.unshift(entry);
}

export const mockTokenService = {
  async createRequest(
    userId: string,
    data: RequestTokenData,
  ): Promise<{ request: TokenRequest; paymentRequired: boolean; fee: number }> {
    const db = getDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');

    // Free-limit check for internal users (student/staff) only
    const userRequests = db.tokenRequests.filter((r) => r.user_id === userId);
    const paidCount = userRequests.length;
    const isInternal = INTERNAL_ROLES.includes(user.role);
    const paymentRequired = isInternal && paidCount >= FREE_TOKEN_LIMIT;
    const fee = paymentRequired ? EXTRA_TOKEN_FEE : 0;

    const request: TokenRequest = {
      id: generateId('req'),
      token_id: newTokenId(),
      user_id: userId,
      role: user.role,
      request_type: data.entry_type,
      entry_type: data.entry_type,
      visitor_name: data.visitor_name,
      visitor_mobile: data.visitor_mobile,
      organization: data.organization,
      purpose: data.purpose,
      date: data.date,
      entry_time: data.entry_time,
      exit_time: data.exit_time,
      location: data.location,
      vehicle_number: data.vehicle_number,
      notes: data.notes,
      student_name: data.student_name,
      student_id_no: data.student_id_no,
      student_department: data.student_department,
      student_semester: data.student_semester,
      face_image_path: data.face_image_path,
      status: 'pending',
      paid: !paymentRequired,
      payment_amount: fee,
      created_at: new Date().toISOString(),
    };
    db.tokenRequests.unshift(request);
    addHistory(db, request.token_id, userId, 'Request submitted', user.full_name);
    persist(db);
    return { request, paymentRequired, fee };
  },

  async markPaid(userId: string, requestId: string, paymentMode = 'UPI'): Promise<TokenRequest> {
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.id === requestId && r.user_id === userId);
    if (!req) throw new Error('Token request not found.');
    const existing = db.payments.find((p) => p.token_request_id === requestId && p.payment_status === 'paid');
    if (existing) { req.paid = true; return req; }
    if (req.payment_amount <= 0) throw new Error('This request does not require payment.');
    req.paid = true;
    const pay: Payment = {
      id: generateId('pay'),
      user_id: userId,
      token_request_id: req.id,
      amount: req.payment_amount,
      payment_status: 'paid',
      transaction_id: `SC-DEMO-${Date.now().toString(36).slice(-10).toUpperCase()}`,
      currency: 'INR',
      payment_mode: paymentMode,
      provider: 'DEMO',
      is_demo: true,
      created_at: new Date().toISOString(),
    };
    db.payments.unshift(pay);
    addHistory(db, req.token_id, req.user_id, 'Payment completed (demo)', 'System');
    persist(db);
    return req;
  },

  getPayments(userId: string): Payment[] {
    return getDB().payments.filter((p) => p.user_id === userId).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  async attachFaceImage(userId: string, requestId: string, path: string): Promise<TokenRequest> {
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.id === requestId && r.user_id === userId);
    if (!req) throw new Error('Token request not found.');
    req.face_image_path = path;
    req.updated_at = new Date().toISOString();
    addHistory(db, req.token_id, userId, 'Face image captured', 'User');
    persist(db);
    return req;
  },

  async getFaceImageUrl(_userId: string | null, path: string): Promise<string> {
    return path;
  },

  getByUser(userId: string): TokenRequest[] {
    return getDB()
      .tokenRequests.filter((r) => r.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  getAll(): TokenRequest[] {
    return getDB().tokenRequests.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  getById(id: string): TokenRequest | undefined {
    return getDB().tokenRequests.find((r) => r.id === id);
  },

  getByTokenId(tokenId: string): TokenRequest | undefined {
    return getDB().tokenRequests.find((r) => r.token_id === tokenId);
  },

  updateStatus(
    requestId: string,
    status: TokenStatus,
    adminRemark: string,
    admin: User,
  ): TokenRequest {
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Token request not found.');
    req.status = status;
    if (adminRemark) req.admin_remark = adminRemark;
    req.updated_at = new Date().toISOString();
    addHistory(
      db,
      req.token_id,
      req.user_id,
      `Request ${status}`,
      admin.full_name,
    );
    persist(db);
    return req;
  },

  cancel(requestId: string, user: User): TokenRequest {
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Token request not found.');
    if (req.status === 'approved' || req.status === 'active') {
      throw new Error('Approved/active tokens cannot be cancelled. Contact admin.');
    }
    req.status = 'rejected';
    addHistory(db, req.token_id, req.user_id, 'Request cancelled by user', user.full_name);
    persist(db);
    return req;
  },

  getHistoryByUser(userId: string): TokenHistoryEntry[] {
    return getDB()
      .tokenHistory.filter((h) => h.user_id === userId)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  },

  getHistoryByToken(tokenId: string): TokenHistoryEntry[] {
    return getDB()
      .tokenHistory.filter((h) => h.token_id === tokenId)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
  },

  getFreeUsage(userId: string): { used: number; remaining: number } {
    const db = getDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user || !INTERNAL_ROLES.includes(user.role)) {
      return { used: 0, remaining: 0 };
    }
    const count = db.tokenRequests.filter((r) => r.user_id === userId).length;
    return { used: count, remaining: Math.max(0, FREE_TOKEN_LIMIT - count) };
  },

  allowEntry(tokenId: string, verifiedBy: User, location = 'Main Gate'): { request: TokenRequest; log: EntryLog } {
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.token_id === tokenId);
    if (!req) throw new Error('Token not found.');
    if (!['pending','approved','active'].includes(req.status)) {
      throw new Error(`Token is ${req.status}. Entry cannot be allowed.`);
    }
    req.status = 'active';
    const log: EntryLog = {
      id: generateId('log'),
      token_id: tokenId,
      verified_by: verifiedBy.full_name,
      gate_name: location,
      entry_time: new Date().toISOString(),
      status: 'allowed',
    };
    db.entryLogs.unshift(log);
    addHistory(db, tokenId, req.user_id, 'Entry allowed', verifiedBy.full_name);
    persist(db);
    return { request: req, log };
  },

  markExit(tokenId: string, verifiedBy: User, location = 'Main Gate'): { request: TokenRequest; log: EntryLog } {
    if (verifiedBy.role !== 'security' && verifiedBy.role !== 'admin') throw new Error('Only Security Staff or Admin can mark exit.');
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.token_id === tokenId);
    if (!req) throw new Error('Token not found.');
    if (req.status !== 'active') throw new Error('Only an active token can be marked as exited.');
    const openLog = db.entryLogs.find((log) => log.token_id === tokenId && log.status === 'allowed' && !log.exit_time);
    if (!openLog) throw new Error('No active entry was found for this token.');
    openLog.exit_time = new Date().toISOString();
    openLog.exit_gate_name = location;
    addHistory(db, tokenId, req.user_id, `Exit marked at ${location}`, verifiedBy.full_name);
    persist(db);
    return { request: req, log: openLog };
  },

  adminUpdateToken(requestId: string, updates: Record<string, unknown>, admin: User): TokenRequest {
    if (admin.role !== 'admin') throw new Error('Administrator authorization required.');
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Token not found.');
    if (typeof updates.purpose === 'string') req.purpose = updates.purpose;
    if (typeof updates.location === 'string') req.location = updates.location;
    if (typeof updates.student_name === 'string') req.student_name = updates.student_name;
    if (typeof updates.exit_time === 'string') req.exit_time = updates.exit_time;
    if (typeof updates.date === 'string') req.date = updates.date;
    if (typeof updates.notes === 'string') req.notes = updates.notes;
    persist(db);
    return req;
  },

  adminDeleteToken(requestId: string, admin: User): void {
    if (admin.role !== 'admin') throw new Error('Administrator authorization required.');
    const db = getDB();
    const index = db.tokenRequests.findIndex((r) => r.id === requestId);
    if (index < 0) throw new Error('Token not found.');
    db.tokenRequests.splice(index, 1);
    persist(db);
  },

  rejectEntry(tokenId: string, verifiedBy: User): EntryLog {
    const db = getDB();
    const req = db.tokenRequests.find((r) => r.token_id === tokenId);
    if (!req) throw new Error('Token not found.');
    const log: EntryLog = {
      id: generateId('log'),
      token_id: tokenId,
      verified_by: verifiedBy.full_name,
      gate_name: 'Main Gate',
      entry_time: new Date().toISOString(),
      status: 'rejected',
    };
    db.entryLogs.unshift(log);
    addHistory(db, tokenId, req.user_id, 'Entry rejected', verifiedBy.full_name);
    persist(db);
    return log;
  },

  getEntryLogs(): EntryLog[] {
    return getDB().entryLogs.sort((a, b) => (a.entry_time < b.entry_time ? 1 : -1));
  },
};
