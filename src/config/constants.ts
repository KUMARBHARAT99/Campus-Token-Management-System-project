import type { AccountStatus, EntryType, Role, TokenStatus } from '@/types';

export const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: 'student_temporary_access', label: 'Student Temporary Access' },
  { value: 'parent_guardian', label: 'Parent / Guardian' },
  { value: 'visitor', label: 'Visitor' },
  { value: 'external_faculty', label: 'External Faculty / Company' },
  { value: 'maintenance', label: 'Maintenance / Service Staff' },
  { value: 'delivery', label: 'Delivery / Vendor' },
  { value: 'event', label: 'Event / Seminar' },
  { value: 'restricted_lab', label: 'Restricted Lab / Library' },
  { value: 'vehicle_parking', label: 'Temporary Vehicle / Parking' },
  { value: 'after_hours', label: 'After-hours Access' },
  { value: 'other_authorized', label: 'Other Authorized Access' },
];

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = Object.fromEntries(
  ENTRY_TYPES.map((e) => [e.value, e.label]),
) as Record<EntryType, string>;

// Public signup categories (never includes admin or security).
export const SIGNUP_CATEGORIES: { value: Role; label: string; desc: string }[] = [
  { value: 'student', label: 'Student', desc: 'Request and manage campus access' },
  { value: 'staff', label: 'College Staff / Faculty', desc: 'Staff and authorized campus access' },
  { value: 'other', label: 'Other / Outsider', desc: 'Visitor, vendor, external faculty and other access' },
  { value: 'admin', label: 'Admin Request', desc: 'Restricted administrator access request; approval does not grant admin by itself' },
];

export const ROLES: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'staff', label: 'College Staff / Faculty' },
  { value: 'other', label: 'Other / Outsider' },
  { value: 'admin', label: 'Administrator' },
  { value: 'security', label: 'Security Staff' },
];

export const ROLE_LABEL: Record<Role, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
) as Record<Role, string>;

export const ACCOUNT_STATUS_META: Record<AccountStatus, { label: string; badge: string }> = {
  pending_approval: { label: 'Pending Approval', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-700 border-red-200' },
  suspended: { label: 'Suspended', badge: 'bg-red-100 text-red-700 border-red-200' },
  active: { label: 'Active', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

// Role-based entry type access — determines which request types each role sees.
export const ENTRY_TYPES_BY_ROLE: Record<Role, EntryType[]> = {
  student: [
    'student_temporary_access',
    'parent_guardian',
    'visitor',
    'event',
    'restricted_lab',
    'vehicle_parking',
  ],
  staff: [
    'visitor',
    'event',
    'restricted_lab',
    'vehicle_parking',
    'after_hours',
    'student_temporary_access',
  ],
  other: [
    'visitor',
    'external_faculty',
    'maintenance',
    'delivery',
    'event',
    'other_authorized',
  ],
  admin: [],
  security: [],
};

export function getEntryTypesForRole(role: Role): { value: EntryType; label: string }[] {
  const allowed = ENTRY_TYPES_BY_ROLE[role] ?? [];
  return ENTRY_TYPES.filter((e) => allowed.includes(e.value));
}

// Roles that can access the admin area (dashboard, requests, verification, etc.)
export const ADMIN_AREA_ROLES: Role[] = ['admin', 'security'];

// Roles considered "internal" college users for the payment rule.
export const INTERNAL_ROLES: Role[] = ['student', 'staff'];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Business Administration',
  'Other',
];

export const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Library Block',
  'Science Block',
  'Engineering Block',
  'Administration Block',
  'Auditorium',
  'Sports Complex',
  'Hostel Block',
  'Parking Lot A',
  'Parking Lot B',
];

// Common verification points used after a QR scan. The scanner can also
// record an ad-hoc location through the `Other` option.
export const VERIFICATION_LOCATIONS = [
  'Main Gate',
  'Library Block',
  'Science Block',
  'Engineering Block',
  'Administration Block',
  'Other',
];

export const TOKEN_STATUS_META: Record<
  TokenStatus,
  { label: string; badge: string }
> = {
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', badge: 'bg-red-100 text-red-700 border-red-200' },
  active: { label: 'Active', badge: 'bg-brand-100 text-brand-700 border-brand-200' },
  expired: { label: 'Expired', badge: 'bg-ink-200 text-ink-600 border-ink-300' },
  used: { label: 'Used', badge: 'bg-ink-200 text-ink-600 border-ink-300' },
  revoked: { label: 'Revoked', badge: 'bg-red-100 text-red-700 border-red-200' },
};

// Business rule: 2 free requests for internal users (student/staff), then ₹50 each.
// Outsiders are not charged through this system.
export const FREE_TOKEN_LIMIT = 2;
export const EXTRA_TOKEN_FEE = 50;

// Entry types where the student is requesting access for themselves.
export const SELF_ACCESS_TYPES: EntryType[] = ['student_temporary_access'];

// Entry types where a student hosts a visitor/parent/guardian (host fields shown).
export const STUDENT_HOST_TYPES: EntryType[] = [
  'parent_guardian',
  'visitor',
  'event',
  'restricted_lab',
  'after_hours',
];

export function isSelfAccess(type: EntryType): boolean {
  return SELF_ACCESS_TYPES.includes(type);
}

export function isStudentHostType(type: EntryType): boolean {
  return STUDENT_HOST_TYPES.includes(type);
}

// Admin email from environment — the reserved admin account.
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined ?? '').trim();
