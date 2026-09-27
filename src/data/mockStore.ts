// Local mock data store. Simulates the planned Supabase tables with
// localStorage persistence so the demo survives page reloads.

import type {
  EntryLog,
  Payment,
  TokenHistoryEntry,
  TokenRequest,
  User,
} from '@/types';
import { generateId } from '@/utils';

const STORAGE_KEY = 'sctms_mock_db_v2';

interface MockDB {
  users: (User & { password: string })[];
  tokenRequests: TokenRequest[];
  tokenHistory: TokenHistoryEntry[];
  entryLogs: EntryLog[];
  payments: Payment[];
}

function seed(): MockDB {
  const admin: User & { password: string } = {
    id: 'usr_admin',
    full_name: 'Rajesh Kumar',
    email: 'admin@campus.edu',
    mobile: '9000000001',
    role: 'admin',
    account_status: 'approved',
    password: 'demo1234',
    created_at: new Date('2026-01-05T09:00:00').toISOString(),
  };
  const security: User & { password: string } = {
    id: 'usr_security',
    full_name: 'Suresh Patel',
    email: 'security@campus.edu',
    mobile: '9000000002',
    role: 'security',
    account_status: 'approved',
    password: 'demo1234',
    created_at: new Date('2026-01-05T09:00:00').toISOString(),
  };
  const student: User & { password: string } = {
    id: 'usr_student',
    full_name: 'Aarav Sharma',
    email: 'student@campus.edu',
    mobile: '9876543210',
    student_id: 'CS21B045',
    department: 'Computer Science & Engineering',
    semester: 6,
    role: 'student',
    account_status: 'approved',
    password: 'demo1234',
    created_at: new Date('2026-01-10T09:00:00').toISOString(),
  };
  const staff: User & { password: string } = {
    id: 'usr_staff',
    full_name: 'Dr. Priya Nair',
    email: 'staff@campus.edu',
    mobile: '9000000003',
    staff_id: 'FAC201',
    designation: 'Associate Professor',
    department: 'Computer Science & Engineering',
    role: 'staff',
    account_status: 'approved',
    password: 'demo1234',
    created_at: new Date('2026-01-08T09:00:00').toISOString(),
  };

  const now = Date.now();
  const req1: TokenRequest = {
    id: generateId('req'),
    token_id: 'SCT-2026-00001',
    user_id: student.id,
    role: 'student',
    request_type: 'parent_guardian',
    entry_type: 'parent_guardian',
    visitor_name: 'Mohan Sharma',
    visitor_mobile: '9876512340',
    purpose: 'Parent visiting for semester progress discussion',
    date: new Date(now + 86400000).toISOString().slice(0, 10),
    entry_time: '10:00',
    exit_time: '14:00',
    location: 'Hostel Block',
    vehicle_number: 'KA01AB1234',
    notes: 'Father visiting',
    student_name: student.full_name,
    student_id_no: student.student_id,
    student_department: student.department,
    student_semester: student.semester,
    status: 'approved',
    admin_remark: 'Approved. Please carry government ID.',
    paid: false,
    payment_amount: 0,
    created_at: new Date(now - 2 * 86400000).toISOString(),
  };
  const req2: TokenRequest = {
    id: generateId('req'),
    token_id: 'SCT-2026-00002',
    user_id: student.id,
    role: 'student',
    request_type: 'external_faculty',
    entry_type: 'external_faculty',
    visitor_name: 'Tech Solutions Pvt Ltd',
    visitor_mobile: '8012345678',
    organization: 'Tech Solutions Pvt Ltd',
    purpose: 'Guest lecture on cloud computing',
    date: new Date(now + 3 * 86400000).toISOString().slice(0, 10),
    entry_time: '09:00',
    exit_time: '12:00',
    location: 'Auditorium',
    student_name: student.full_name,
    student_id_no: student.student_id,
    student_department: student.department,
    student_semester: student.semester,
    status: 'pending',
    paid: false,
    payment_amount: 0,
    created_at: new Date(now - 4 * 3600000).toISOString(),
  };
  const req3: TokenRequest = {
    id: generateId('req'),
    token_id: 'SCT-2026-00003',
    user_id: student.id,
    role: 'student',
    request_type: 'student_temporary_access',
    entry_type: 'student_temporary_access',
    visitor_name: student.full_name,
    visitor_mobile: student.mobile,
    purpose: 'ID card lost — need temporary library access',
    date: new Date(now - 10 * 86400000).toISOString().slice(0, 10),
    entry_time: '15:00',
    exit_time: '16:00',
    location: 'Library Block',
    student_name: student.full_name,
    student_id_no: student.student_id,
    student_department: student.department,
    student_semester: student.semester,
    status: 'expired',
    paid: true,
    payment_amount: 50,
    created_at: new Date(now - 12 * 86400000).toISOString(),
  };

  const history: TokenHistoryEntry[] = [
    {
      id: generateId('h'),
      token_id: req1.token_id,
      user_id: student.id,
      action: 'Request submitted',
      action_by: student.full_name,
      timestamp: req1.created_at,
    },
    {
      id: generateId('h'),
      token_id: req1.token_id,
      user_id: student.id,
      action: 'Request approved',
      action_by: admin.full_name,
      timestamp: new Date(now - 1 * 86400000).toISOString(),
    },
    {
      id: generateId('h'),
      token_id: req2.token_id,
      user_id: student.id,
      action: 'Request submitted',
      action_by: student.full_name,
      timestamp: req2.created_at,
    },
  ];

  const entryLogs: EntryLog[] = [];

  const payments: Payment[] = [
    {
      id: generateId('pay'),
      user_id: student.id,
      token_request_id: req3.id,
      amount: 50,
      payment_status: 'paid',
      transaction_id: 'DEMO_TXN_001',
      created_at: req3.created_at,
    },
  ];

  return {
    users: [admin, security, student, staff],
    tokenRequests: [req1, req2, req3],
    tokenHistory: history,
    entryLogs,
    payments,
  };
}

function load(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MockDB;
  } catch {
    // ignore
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: MockDB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore
  }
}

let db: MockDB = load();

export function getDB(): MockDB {
  return db;
}

export function persist(next: MockDB): void {
  db = next;
  save(db);
}

export function resetDB(): void {
  db = seed();
  save(db);
}

export function newTokenId(): string {
  const count = db.tokenRequests.length + 1;
  const year = new Date().getFullYear();
  return `SCT-${year}-${String(count).padStart(5, '0')}`;
}

export { generateId };
