import type {
  EntryLog,
  Payment,
  RequestTokenData,
  TokenHistoryEntry,
  TokenRequest,
  TokenStatus,
  User,
} from '@/types';
import { FREE_TOKEN_LIMIT, INTERNAL_ROLES } from '@/config/constants';
import { getSupabase } from './supabaseClient';


function getIndiaDateTimeParts(date = new Date()): { date: string; time: string } {
  const datePart = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return { date: datePart, time: timePart };
}

function isPastValidity(row: Record<string, unknown>, now = new Date()): boolean {
  const tokenDate = String(row.date ?? '');
  const exitTime = String(row.exit_time ?? '');
  if (!tokenDate || !exitTime) return false;
  const india = getIndiaDateTimeParts(now);
  if (tokenDate < india.date) return true;
  if (tokenDate > india.date) return false;
  return exitTime.slice(0, 8) <= india.time.slice(0, 8);
}

function effectiveStatus(row: Record<string, unknown>): TokenStatus {
  const status = row.status as TokenStatus;
  if (['pending', 'approved', 'active'].includes(status) && isPastValidity(row)) {
    return 'expired';
  }
  return status;
}

function mapRequest(row: Record<string, unknown>): TokenRequest {
  const entryType = (row.request_type ?? row.entry_type) as TokenRequest['entry_type'];
  return {
    id: String(row.id),
    token_id: String(row.token_id),
    user_id: row.user_id == null ? '' : String(row.user_id),
    role: (row.role as TokenRequest['role']) ?? 'student',
    request_type: entryType,
    entry_type: entryType,
    visitor_name: String(row.visitor_name ?? ''),
    visitor_mobile: String(row.visitor_mobile ?? ''),
    organization: (row.organization as string) ?? null,
    purpose: String(row.purpose ?? ''),
    date: String(row.date ?? ''),
    entry_time: String(row.entry_time ?? ''),
    exit_time: String(row.exit_time ?? ''),
    location: String(row.location ?? ''),
    vehicle_number: (row.vehicle_number as string) ?? null,
    notes: (row.notes as string) ?? null,
    student_name: (row.student_name as string) ?? null,
    student_id_no: (row.student_id_no as string) ?? null,
    student_department: (row.student_department as string) ?? null,
    student_semester: row.student_semester == null ? null : Number(row.student_semester),
    face_image_path: (row.face_image_path as string) ?? null,
    face_captured_at: (row.face_captured_at as string) ?? null,
    status: effectiveStatus(row),
    admin_remark: (row.admin_remark as string) ?? undefined,
    paid: Boolean(row.paid),
    payment_amount: Number(row.payment_amount ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: (row.updated_at as string) ?? undefined,
    token_kind: row.token_kind === 'temporary_guest' ? 'temporary_guest' : 'standard',
  };
}

function mapHistory(row: Record<string, unknown>): TokenHistoryEntry {
  return {
    id: String(row.id),
    token_id: String(row.token_id),
    user_id: row.user_id == null ? '' : String(row.user_id),
    action: String(row.action ?? ''),
    action_by: String(row.action_by ?? ''),
    timestamp: String(row.timestamp ?? row.created_at ?? new Date().toISOString()),
  };
}

function mapEntryLog(row: Record<string, unknown>): EntryLog {
  return {
    id: String(row.id),
    token_id: (row.token_id as string) ?? '',
    access_request_id: (row.access_request_id as string) ?? null,
    user_id: (row.user_id as string) ?? null,
    gate_name: (row.gate_name as string) ?? 'Main Gate',
    verified_by: (row.verified_by as string) ?? '',
    security_user_id: (row.security_user_id as string) ?? null,
    status: row.status as EntryLog['status'],
    reason: (row.reason as string) ?? null,
    face_verified: Boolean(row.face_verified),
    face_match_score: row.face_match_score == null ? null : Number(row.face_match_score),
    entry_time: String(row.entry_time),
    exit_time: (row.exit_time as string) ?? null,
    exit_gate_name: (row.exit_gate_name as string) ?? null,
    created_at: (row.created_at as string) ?? undefined,
  };
}

function mapPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    user_id: row.user_id == null ? '' : String(row.user_id),
    token_request_id: String(row.token_request_id),
    amount: Number(row.amount ?? 0),
    payment_status: (row.payment_status as Payment['payment_status']) ?? 'pending',
    transaction_id: (row.transaction_id as string) ?? undefined,
    currency: (row.currency as string) ?? 'INR',
    payment_mode: (row.payment_mode as string) ?? null,
    provider: (row.provider as string) ?? null,
    is_demo: Boolean(row.is_demo),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

async function requireSession() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!data.session?.user) throw new Error('Your session has expired. Please login again.');
  return { supabase, user: data.session.user };
}

async function insertHistory(tokenId: string, userId: string | null, action: string, actionBy: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('token_history').insert({
    token_id: tokenId,
    user_id: userId,
    action,
    action_by: actionBy,
  });
  if (error) throw new Error(error.message);
}

export const supabaseTokenService = {
  async createRequest(userId: string, data: RequestTokenData): Promise<{ request: TokenRequest; paymentRequired: boolean; fee: number }> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) throw new Error('Authentication mismatch. Please refresh the page and try again.');

    const { data: rpcResult, error } = await supabase.rpc('create_token_request', {
      p_payload: {
        visitor_name: data.visitor_name,
        visitor_mobile: data.visitor_mobile,
        entry_type: data.entry_type,
        purpose: data.purpose,
        date: data.date,
        entry_time: data.entry_time,
        exit_time: data.exit_time,
        location: data.location,
        vehicle_number: data.vehicle_number ?? null,
        notes: data.notes ?? null,
        organization: data.organization ?? null,
        student_name: data.student_name ?? null,
        student_id_no: data.student_id_no ?? null,
        student_department: data.student_department ?? null,
        student_semester: data.student_semester ?? null,
        face_image_path: data.face_image_path ?? null,
      },
    });
    if (error) throw new Error(error.message);

    const result = rpcResult as { request?: Record<string, unknown>; paymentRequired?: boolean; fee?: number } | null;
    if (!result?.request) throw new Error('The token request was not created.');
    return {
      request: mapRequest(result.request),
      paymentRequired: Boolean(result.paymentRequired),
      fee: Number(result.fee ?? 0),
    };
  },

  async markPaid(userId: string, requestId: string, paymentMode = 'UPI'): Promise<TokenRequest> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.rpc('complete_demo_payment', {
      p_request_id: requestId,
      p_payment_mode: paymentMode,
    });
    if (error) throw new Error(error.message);
    const result = data as { request?: Record<string, unknown>; transactionId?: string } | null;
    if (!result?.request) throw new Error('Demo payment could not be completed.');
    return mapRequest(result.request);
  },

  async getPayments(userId: string): Promise<Payment[]> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown>[]).map(mapPayment);
  },

  async attachFaceImage(userId: string, requestId: string, path: string): Promise<TokenRequest> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.rpc('attach_face_image', {
      p_request_id: requestId,
      p_path: path,
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Face image could not be attached.');
    return mapRequest(data as Record<string, unknown>);
  },

  async getFaceImageUrl(userId: string | null, path: string): Promise<string> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!['admin', 'security', 'staff'].includes(profile?.role as string)) {
        throw new Error('You are not allowed to view this face image.');
      }
    }
    const { data, error } = await supabase.storage.from('token-faces').createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Unable to load face image.');
    return data.signedUrl;
  },

  async getByUser(userId: string): Promise<TokenRequest[]> {
    const { supabase, user } = await requireSession();
    await supabase.rpc('sync_expired_tokens');
    if (user.id !== userId) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.from('token_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown>[]).map(mapRequest);
  },

  async getAll(): Promise<TokenRequest[]> {
    const { supabase } = await requireSession();
    await supabase.rpc('sync_expired_tokens');
    const { data, error } = await supabase.from('token_requests').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown>[]).map(mapRequest);
  },

  async getById(id: string): Promise<TokenRequest | undefined> {
    const { supabase } = await requireSession();
    await supabase.rpc('sync_expired_tokens');
    const { data, error } = await supabase.from('token_requests').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRequest(data as Record<string, unknown>) : undefined;
  },

  async getByTokenId(tokenId: string): Promise<TokenRequest | undefined> {
    const { supabase } = await requireSession();
    await supabase.rpc('sync_expired_tokens');
    const { data, error } = await supabase.from('token_requests').select('*').eq('token_id', tokenId.trim().toUpperCase()).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapRequest(data as Record<string, unknown>) : undefined;
  },

  async updateStatus(requestId: string, status: TokenStatus, adminRemark: string, admin: User): Promise<TokenRequest> {
    const { supabase, user } = await requireSession();
    if (user.id !== admin.id) throw new Error('Authentication mismatch.');
    if (admin.role !== 'admin' && admin.role !== 'security') throw new Error('Administrator authorization required.');
    if (admin.role === 'security' && (status === 'approved' || status === 'rejected')) {
      // Security can manage entry verification, but request approval remains an admin responsibility.
      throw new Error('Only an administrator can approve or reject token requests.');
    }
    if (status === 'approved') {
      const { data: paymentCheck, error: paymentCheckError } = await supabase.from('token_requests').select('paid,payment_amount').eq('id', requestId).single();
      if (paymentCheckError) throw new Error(paymentCheckError.message);
      if (Number(paymentCheck.payment_amount ?? 0) > 0 && paymentCheck.paid !== true) throw new Error('Payment is required before this token request can be approved.');
    }
    const { data, error } = await supabase.from('token_requests').update({ status, admin_remark: adminRemark || null, updated_at: new Date().toISOString() }).eq('id', requestId).select('*').single();
    if (error) throw new Error(error.message);
    const request = mapRequest(data as Record<string, unknown>);
    await insertHistory(request.token_id, request.user_id, `Request ${status}`, admin.full_name);
    return request;
  },

  async cancel(requestId: string, userProfile: User): Promise<TokenRequest> {
    const { supabase, user } = await requireSession();
    if (user.id !== userProfile.id) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.rpc('cancel_token_request', { p_request_id: requestId });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Token request could not be cancelled.');
    return mapRequest(data as Record<string, unknown>);
  },

  async getHistoryByUser(userId: string): Promise<TokenHistoryEntry[]> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.from('token_history').select('*').eq('user_id', user.id).order('timestamp', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown>[]).map(mapHistory);
  },

  async getHistoryByToken(tokenId: string): Promise<TokenHistoryEntry[]> {
    const { supabase } = await requireSession();
    const { data, error } = await supabase.from('token_history').select('*').eq('token_id', tokenId).order('timestamp', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown>[]).map(mapHistory);
  },

  async getFreeUsage(userId: string): Promise<{ used: number; remaining: number }> {
    const { supabase, user } = await requireSession();
    if (user.id !== userId) throw new Error('Authentication mismatch.');
    const { data, error } = await supabase.rpc('get_semester_token_quota', { p_user_id: user.id });
    if (!error && data) {
      const row = data as { used?: number; remaining?: number };
      return { used: Number(row.used ?? 0), remaining: Number(row.remaining ?? 0) };
    }
    // Backward-compatible fallback for an older database before the upgrade SQL is applied.
    const { data: profile } = await supabase.from('profiles').select('role,semester').eq('id', user.id).maybeSingle();
    const role = (profile?.role as User['role']) ?? 'other';
    if (!INTERNAL_ROLES.includes(role)) return { used: 0, remaining: 0 };
    const semester = profile?.semester == null ? null : Number(profile.semester);
    const { data: rows, error: rowsError } = await supabase.from('token_requests').select('payment_amount,paid,date,created_at').eq('user_id', user.id);
    if (rowsError) throw new Error(rowsError.message);
    const year = new Date().getFullYear();
    const used = (rows as Array<{ payment_amount?: number; paid?: boolean; date?: string; created_at?: string }>).filter((row) => {
      const d = new Date(row.date || row.created_at || '');
      return d.getFullYear() === year && (semester == null || true) && (Number(row.payment_amount ?? 0) === 0 || row.paid === true);
    }).length;
    return { used, remaining: Math.max(0, FREE_TOKEN_LIMIT - used) };
  },

  async allowEntry(tokenId: string, verifiedBy: User, location = 'Main Gate'): Promise<{ request: TokenRequest; log: EntryLog }> {
    const { supabase, user } = await requireSession();
    if (user.id !== verifiedBy.id) throw new Error('Authentication mismatch.');
    if (!['admin', 'security', 'staff'].includes(verifiedBy.role)) throw new Error('You are not authorized to scan tokens.');
    const { data, error } = await supabase.rpc('mark_token_entry', {
      p_token_id: tokenId.trim().toUpperCase(),
      p_gate_name: location.trim() || 'Main Gate',
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('token has expired')) throw new Error('Token has expired.');
      if (message.includes('payment is required')) throw new Error('Payment is required before this token can be activated.');
      if (message.includes('already used')) throw new Error('This older token was already used and cannot be scanned again.');
      if (message.includes('security authorization')) throw new Error('You are not authorized to verify entry.');
      throw new Error(error.message || 'Unable to verify entry right now.');
    }
    const result = data as { request?: Record<string, unknown>; log?: Record<string, unknown> } | null;
    if (!result?.request || !result.log) throw new Error('Entry could not be verified.');
    return { request: mapRequest(result.request), log: mapEntryLog(result.log) };
  },

  async markExit(tokenId: string, verifiedBy: User, location = 'Main Gate'): Promise<{ request: TokenRequest; log: EntryLog }> {
    const { supabase, user } = await requireSession();
    if (user.id !== verifiedBy.id) throw new Error('Authentication mismatch.');
    if (verifiedBy.role !== 'security' && verifiedBy.role !== 'admin') throw new Error('Only Security Staff or Admin can mark exit.');
    const { data, error } = await supabase.rpc('mark_token_exit', {
      p_token_id: tokenId.trim().toUpperCase(),
      p_gate_name: location.trim() || 'Main Gate',
    });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('active token')) throw new Error('Only an active token can be marked as exited.');
      if (message.includes('no active entry')) throw new Error('No active entry was found for this token.');
      if (message.includes('security authorization')) throw new Error('Only Security Staff or Admin can mark exit.');
      throw new Error(error.message || 'Unable to mark exit right now.');
    }
    const result = data as { request?: Record<string, unknown>; log?: Record<string, unknown> } | null;
    if (!result?.request || !result.log) throw new Error('Exit could not be recorded.');
    return { request: mapRequest(result.request), log: mapEntryLog(result.log) };
  },

  async rejectEntry(tokenId: string, verifiedBy: User): Promise<EntryLog> {
    const { supabase, user } = await requireSession();
    if (user.id !== verifiedBy.id) throw new Error('Authentication mismatch.');
    if (verifiedBy.role !== 'admin' && verifiedBy.role !== 'security') throw new Error('Security authorization required.');
    const normalized = tokenId.trim().toUpperCase();
    const { data: req, error: reqError } = await supabase.from('token_requests').select('id,user_id').eq('token_id', normalized).maybeSingle();
    if (reqError || !req) throw new Error('Token not found.');
    const { data: logRow, error: logErr } = await supabase.from('entry_logs').insert({ token_id: normalized, access_request_id: (req as Record<string, unknown>).id, user_id: (req as Record<string, unknown>).user_id, security_user_id: verifiedBy.id, verified_by: verifiedBy.full_name, entry_time: new Date().toISOString(), status: 'rejected' }).select('*').single();
    if (logErr) throw new Error(logErr.message);
    const log = mapEntryLog(logRow as Record<string, unknown>);
    await insertHistory(normalized, String((req as Record<string, unknown>).user_id), 'Entry rejected', verifiedBy.full_name);
    return log;
  },

  async adminUpdateToken(requestId: string, updates: Record<string, unknown>, admin: User): Promise<TokenRequest> {
    const { supabase, user } = await requireSession();
    if (user.id !== admin.id || admin.role !== 'admin') throw new Error('Administrator authorization required.');
    const { data, error } = await supabase.rpc('admin_update_token', { p_request_id: requestId, p_updates: updates });
    if (error || !data) throw new Error(error?.message || 'Token could not be updated.');
    return mapRequest(data as Record<string, unknown>);
  },

  async adminDeleteToken(requestId: string, admin: User): Promise<void> {
    const { supabase, user } = await requireSession();
    if (user.id !== admin.id || admin.role !== 'admin') throw new Error('Administrator authorization required.');
    const { error } = await supabase.rpc('admin_delete_token', { p_request_id: requestId });
    if (error) throw new Error(error.message);
  },

  async getEntryLogs(): Promise<EntryLog[]> {
    const { supabase } = await requireSession();
    const { data, error } = await supabase.from('entry_logs').select('*').order('entry_time', { ascending: false });
    if (error) throw new Error(error.message);
    return (data as Record<string, unknown>[]).map(mapEntryLog);
  },
};
