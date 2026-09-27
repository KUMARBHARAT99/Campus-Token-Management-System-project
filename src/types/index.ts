/* ============================================================
   SMART CAMPUS TOKEN MANAGEMENT SYSTEM
   Canonical Application Types
   ============================================================ */

/* ------------------------------------------------------------
   USER ROLES
   ------------------------------------------------------------ */

/**
 * Main application roles.
 *
 * STUDENT:
 * College student. Can request temporary access for
 * themselves or for permitted people such as parents/visitors.
 *
 * STAFF:
 * College faculty/staff member.
 *
 * OTHER:
 * External/outsider user such as visitor, parent, vendor,
 * external faculty/company representative, etc.
 *
 * ADMIN:
 * System administrator. Never selectable through public signup.
 *
 * SECURITY:
 * Campus security/gate operator.
 */
export type UserRole =
  | 'student'
  | 'staff'
  | 'other'
  | 'admin'
  | 'security';


/* ------------------------------------------------------------
   ACCOUNT STATUS
   ------------------------------------------------------------ */

export type AccountStatus =
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'active';


/* ------------------------------------------------------------
   ACCESS TYPES
   ------------------------------------------------------------ */

/**
 * All temporary campus-entry purposes supported by the system.
 *
 * Keep these IDs consistent everywhere:
 * landing page
 * signup
 * request-token page
 * database
 * admin
 * security
 */
export type AccessType =
  | 'forgot_id'
  | 'visitor'
  | 'parent_guardian'
  | 'external_faculty'
  | 'maintenance_staff'
  | 'delivery_vendor'
  | 'special_event'
  | 'restricted_lab'
  | 'restricted_library'
  | 'vehicle_parking'
  | 'after_hours';


/* ------------------------------------------------------------
   ACCESS TYPE LABELS
   ------------------------------------------------------------ */

export const ACCESS_TYPE_LABELS: Record<
  AccessType,
  string
> = {
  forgot_id: 'Forgot ID Card',

  visitor: 'Visitor Entry',

  parent_guardian: 'Parent / Guardian',

  external_faculty: 'External Faculty / Company',

  maintenance_staff: 'Maintenance / Service Staff',

  delivery_vendor: 'Delivery / Vendor',

  special_event: 'Event / Seminar',

  restricted_lab: 'Restricted Lab',

  restricted_library: 'Restricted Library',

  vehicle_parking: 'Temporary Vehicle / Parking',

  after_hours: 'After-Hours Campus Access',
};


/* ------------------------------------------------------------
   ACCESS TYPE DESCRIPTIONS
   ------------------------------------------------------------ */

export const ACCESS_TYPE_DESCRIPTIONS: Record<
  AccessType,
  string
> = {
  forgot_id:
    'Temporary campus entry when a student or staff member does not have their physical ID card.',

  visitor:
    'Temporary entry for a campus visitor.',

  parent_guardian:
    'Campus entry for a student parent or guardian.',

  external_faculty:
    'Entry for external faculty, company representatives or academic visitors.',

  maintenance_staff:
    'Entry for authorized maintenance or service personnel.',

  delivery_vendor:
    'Entry for delivery partners and vendors.',

  special_event:
    'Temporary access for seminars, events and special campus programs.',

  restricted_lab:
    'Controlled access to a restricted laboratory.',

  restricted_library:
    'Special access to restricted library areas.',

  vehicle_parking:
    'Temporary vehicle or parking access.',

  after_hours:
    'Campus access outside normal operating hours.',
};


/* ------------------------------------------------------------
   ACCESS TYPE GROUPS
   ------------------------------------------------------------ */

/**
 * Access commonly requested by students.
 */
export const STUDENT_ACCESS_TYPES: AccessType[] = [
  'forgot_id',
  'visitor',
  'parent_guardian',
  'external_faculty',
  'special_event',
];


/**
 * Access commonly requested by college staff.
 */
export const STAFF_ACCESS_TYPES: AccessType[] = [
  'forgot_id',
  'visitor',
  'parent_guardian',
  'external_faculty',
  'maintenance_staff',
  'delivery_vendor',
  'special_event',
  'restricted_lab',
  'restricted_library',
  'vehicle_parking',
  'after_hours',
];


/**
 * Access available to external/other users.
 */
export const OTHER_ACCESS_TYPES: AccessType[] = [
  'visitor',
  'parent_guardian',
  'external_faculty',
  'maintenance_staff',
  'delivery_vendor',
  'special_event',
  'vehicle_parking',
  'after_hours',
];


/**
 * All access types.
 */
export const ALL_ACCESS_TYPES: AccessType[] = [
  'forgot_id',
  'visitor',
  'parent_guardian',
  'external_faculty',
  'maintenance_staff',
  'delivery_vendor',
  'special_event',
  'restricted_lab',
  'restricted_library',
  'vehicle_parking',
  'after_hours',
];


/* ------------------------------------------------------------
   USER PROFILE
   ------------------------------------------------------------ */

export interface UserProfile {
  id: string;

  full_name: string;

  email: string;

  role: UserRole;

  phone: string | null;

  avatar_url: string | null;

  /**
   * Whether the account is currently allowed to use
   * the application.
   */
  is_active: boolean;

  /**
   * Optional access category associated with the profile.
   *
   * Normally the role controls the dashboard while
   * access_type controls a particular entry request.
   */
  access_type: AccessType | null;

  /**
   * Account verification / approval state.
   */
  account_status?: AccountStatus;

  /**
   * Optional student-specific information.
   */
  student_id?: string | null;

  department?: string | null;

  program?: string | null;

  semester?: number | null;

  /**
   * Optional staff information.
   */
  employee_id?: string | null;

  designation?: string | null;

  /**
   * Optional outsider information.
   */
  organization?: string | null;

  /** Role the user requested during registration; never grants privileges. */
  requested_role?: UserRole | null;

  /**
   * Whether the user's identity has been verified.
   */
  is_verified?: boolean;

  /**
   * Whether biometric enrollment has been completed.
   */
  face_enrolled?: boolean;

  created_at?: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   APPLICATION USER
   ------------------------------------------------------------ */

/**
 * Backward-compatible user object used by existing pages.
 */
export interface AppUser {
  id: string;

  email: string;

  name: string;

  role: UserRole;

  phone: string | null;

  avatarUrl: string | null;

  isActive: boolean;

  account_status?: AccountStatus;
  created_at?: string;

  studentId: string | null;

  accessType: AccessType | null;

  accountStatus?: AccountStatus;

  department?: string | null;

  employeeId?: string | null;

  organization?: string | null;

  isVerified?: boolean;

  faceEnrolled?: boolean;
}


/* ------------------------------------------------------------
   STUDENT
   ------------------------------------------------------------ */

export interface StudentProfile {
  id: string;

  profile_id: string;

  student_id: string;

  full_name: string;

  email: string | null;

  department: string;

  program: string | null;

  semester: number | null;

  phone: string | null;

  status: string;

  created_at?: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   STAFF
   ------------------------------------------------------------ */

export interface StaffProfile {
  id: string;

  profile_id: string;

  employee_id: string;

  full_name: string;

  email: string | null;

  department: string | null;

  designation: string | null;

  phone: string | null;

  status: string;

  created_at?: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   OUTSIDER / OTHER PROFILE
   ------------------------------------------------------------ */

export interface OtherProfile {
  id: string;

  profile_id: string;

  full_name: string;

  email: string | null;

  phone: string | null;

  organization: string | null;

  identity_type?: string | null;

  identity_number?: string | null;

  status: string;

  created_at?: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   ACCESS REQUEST
   ------------------------------------------------------------ */

export type AccessRequestStatus =
  | 'pending'
  | 'verified'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed';


export interface AccessRequest {
  id: string;

  requester_id: string;

  /**
   * Role of the person making the request.
   */
  requester_role: UserRole;

  /**
   * Actual purpose of this entry request.
   */
  access_type: AccessType;

  /**
   * Optional person being invited/entered.
   *
   * Example:
   * Student requests parent entry.
   */
  visitor_name?: string | null;

  visitor_mobile?: string | null;

  visitor_email?: string | null;

  organization?: string | null;

  purpose: string;

  reason: string | null;

  requested_at: string;

  status: AccessRequestStatus;

  verified_at: string | null;

  approved_at?: string | null;

  rejected_at?: string | null;

  completed_at: string | null;

  rejection_reason: string | null;

  /**
   * Face verification information.
   */
  face_required?: boolean;

  face_verified?: boolean;

  face_match_score?: number | null;

  face_verified_at?: string | null;

  /**
   * Payment information.
   */
  payment_required?: boolean;

  payment_status?: PaymentStatus;

  payment_id?: string | null;

  amount?: number;

  created_at?: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   TOKEN
   ------------------------------------------------------------ */

export type TokenStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'used'
  | 'expired'
  | 'revoked';


export interface Token {
  id: string;

  access_request_id: string;

  requester_id: string;

  token_code: string;

  status: TokenStatus;

  issued_at: string;

  expires_at: string;

  used_at: string | null;

  revoked_at?: string | null;

  /**
   * QR payload / token data.
   */
  qr_data?: string | null;

  /**
   * Face verification result associated with token issuance.
   */
  face_verified?: boolean;

  face_match_score?: number | null;

  created_at?: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   PAYMENT
   ------------------------------------------------------------ */

export type PaymentStatus =
  | 'not_required'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';


export interface PaymentRecord {
  id: string;

  user_id: string;

  access_request_id: string | null;

  amount: number;

  currency: string;

  status: PaymentStatus;

  provider?: string | null;

  transaction_id?: string | null;

  created_at: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   FREE REQUEST / PAYMENT POLICY
   ------------------------------------------------------------ */

/**
 * Defines which users get the two free requests.
 *
 * College users:
 *   Student
 *   Staff
 *
 * Outsiders:
 *   Other
 *
 * The actual enforcement must eventually happen server-side
 * through Supabase/RPC, not only in the frontend.
 */
export interface RequestQuota {
  user_id: string;

  role: UserRole;

  free_requests_allowed: number;

  free_requests_used: number;

  paid_requests_used: number;

  remaining_free_requests: number;

  updated_at?: string;
}


/* ------------------------------------------------------------
   FACE VERIFICATION
   ------------------------------------------------------------ */

export type FaceVerificationStatus =
  | 'not_started'
  | 'captured'
  | 'processing'
  | 'matched'
  | 'not_matched'
  | 'failed';


export interface FaceVerification {
  id: string;

  user_id: string;

  access_request_id?: string | null;

  token_id?: string | null;

  status: FaceVerificationStatus;

  match_score?: number | null;

  liveness_passed?: boolean | null;

  captured_at?: string | null;

  verified_at?: string | null;

  failure_reason?: string | null;

  created_at: string;
}


/* ------------------------------------------------------------
   ENTRY LOG
   ------------------------------------------------------------ */

export type EntryLogStatus =
  | 'allowed'
  | 'rejected';


export interface EntryLog {
  id: string;

  token_id: string | null;

  access_request_id?: string | null;

  user_id?: string | null;

  gate_name?: string;

  verified_by?: string;

  security_user_id?: string | null;

  status: EntryLogStatus;

  reason?: string | null;

  face_verified?: boolean;

  face_match_score?: number | null;

  entry_time: string;

  exit_time?: string | null;

  exit_gate_name?: string | null;

  created_at?: string;
}


/* ------------------------------------------------------------
   ADMIN APPROVAL
   ------------------------------------------------------------ */

export type AdminApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';


export interface AdminApproval {
  id: string;

  user_id: string;

  reviewed_by: string | null;

  status: AdminApprovalStatus;

  rejection_reason?: string | null;

  reviewed_at?: string | null;

  created_at: string;

  updated_at?: string;
}


/* ------------------------------------------------------------
   SECURITY VERIFICATION
   ------------------------------------------------------------ */

export interface SecurityVerification {
  id: string;

  token_id: string;

  security_user_id: string;

  token_valid: boolean;

  face_required: boolean;

  face_verified: boolean;

  match_score?: number | null;

  decision: 'allowed' | 'rejected';

  reason?: string | null;

  verified_at: string;
}


/* ------------------------------------------------------------
   NOTIFICATIONS
   ------------------------------------------------------------ */

export type NotificationType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning';


export interface Notification {
  id: string;

  user_id?: string;

  type: NotificationType;

  title?: string;

  message: string;

  read?: boolean;

  created_at?: string;
}


/* ------------------------------------------------------------
   ROLE HELPERS
   ------------------------------------------------------------ */

export const USER_ROLE_LABELS: Record<
  UserRole,
  string
> = {
  student: 'Student',
  staff: 'College Staff',
  other: 'Other / Outsider',
  admin: 'Administrator',
  security: 'Security Staff',
};


export const USER_ROLE_DESCRIPTIONS: Record<
  UserRole,
  string
> = {
  student:
    'College student with access to student campus services.',

  staff:
    'Faculty or authorized college staff member.',

  other:
    'Visitor, parent, vendor, external faculty or other outsider.',

  admin:
    'System administrator with management privileges.',

  security:
    'Authorized campus security staff responsible for gate verification.',
};


/* ------------------------------------------------------------
   PUBLIC SIGNUP ROLES
   ------------------------------------------------------------ */

/**
 * IMPORTANT:
 * Admin and Security are intentionally NOT included.
 *
 * Nobody can become an admin/security user by selecting
 * a role on the public signup page.
 */
export const PUBLIC_SIGNUP_ROLES: UserRole[] = [
  'student',
  'staff',
  'other',
];


/* ------------------------------------------------------------
   ROLE CHECK HELPERS
   ------------------------------------------------------------ */

export function isStudentRole(
  role: UserRole | null | undefined,
): boolean {
  return role === 'student';
}


export function isStaffRole(
  role: UserRole | null | undefined,
): boolean {
  return role === 'staff';
}


export function isOtherRole(
  role: UserRole | null | undefined,
): boolean {
  return role === 'other';
}


export function isAdminRole(
  role: UserRole | null | undefined,
): boolean {
  return role === 'admin';
}


export function isSecurityRole(
  role: UserRole | null | undefined,
): boolean {
  return role === 'security';
}


/* ------------------------------------------------------------
   COLLEGE USER CHECK
   ------------------------------------------------------------ */

/**
 * Student + Staff are treated as college users.
 *
 * This is important for the later payment rule:
 *
 * Student -> college user
 * Staff   -> college user
 * Other   -> outsider
 */
export function isCollegeUser(
  role: UserRole | null | undefined,
): boolean {
  return role === 'student' || role === 'staff';
}


/* ------------------------------------------------------------
   OUTSIDER CHECK
   ------------------------------------------------------------ */

export function isOutsider(
  role: UserRole | null | undefined,
): boolean {
  return role === 'other';
}


/* ------------------------------------------------------------
   ADMIN / SECURITY ACCESS
   ------------------------------------------------------------ */

export function canAccessAdmin(
  role: UserRole | null | undefined,
): boolean {
  return role === 'admin';
}


export function canAccessSecurity(
  role: UserRole | null | undefined,
): boolean {
  return role === 'security' || role === 'admin';
}


/* ------------------------------------------------------------
   ACCESS PERMISSION HELPERS
   ------------------------------------------------------------ */

export function canRequestAccessType(
  role: UserRole,
  accessType: AccessType,
): boolean {
  if (role === 'admin' || role === 'security') {
    return true;
  }

  if (role === 'student') {
    return STUDENT_ACCESS_TYPES.includes(
      accessType,
    );
  }

  if (role === 'staff') {
    return STAFF_ACCESS_TYPES.includes(
      accessType,
    );
  }

  if (role === 'other') {
    return OTHER_ACCESS_TYPES.includes(
      accessType,
    );
  }

  return false;
}


/* ------------------------------------------------------------
   PAYMENT RULE HELPERS
   ------------------------------------------------------------ */

/**
 * College users receive the free quota.
 *
 * Outsiders do not receive the college free quota.
 */
export function getsFreeRequestQuota(
  role: UserRole,
): boolean {
  return isCollegeUser(role);
}


export function getDefaultFreeRequestLimit(
  role: UserRole,
): number {
  return getsFreeRequestQuota(role)
    ? 2
    : 0;
}


/**
 * Whether a new request requires payment based on
 * the user's quota.
 */
export function requiresPayment(
  role: UserRole,
  freeRequestsUsed: number,
): boolean {
  const freeLimit =
    getDefaultFreeRequestLimit(role);

  return freeRequestsUsed >= freeLimit;
}


/**
 * Current planned additional request fee.
 */
export const ADDITIONAL_REQUEST_FEE = 50;


/* ------------------------------------------------------------
   FACE VERIFICATION POLICY
   ------------------------------------------------------------ */

/**
 * Face verification is required when a token is generated.
 *
 * The actual biometric processing must NOT happen using
 * secret keys directly in the browser.
 */
export const FACE_VERIFICATION_REQUIRED = true;


/* ------------------------------------------------------------
   TOKEN POLICY
   ------------------------------------------------------------ */

export const TOKEN_DEFAULT_VALIDITY_MINUTES = 30;


/* ------------------------------------------------------------
   ADMIN CONFIGURATION
   ------------------------------------------------------------ */

/**
 * Public signup must NEVER use this value to grant admin.
 *
 * This is only a frontend reference for the reserved
 * administrator identity.
 *
 * Final authorization MUST be enforced server-side through
 * Supabase/database policies.
 */
export const RESERVED_ADMIN_EMAIL =
  'kumarbharat.ac.in@gmail.com';


/* ------------------------------------------------------------
   ROUTE IDENTIFIERS
   ------------------------------------------------------------ */

export const ROLE_HOME_ROUTES: Record<
  UserRole,
  string
> = {
  student: '/student',
  staff: '/staff',
  other: '/other',
  admin: '/admin',
  security: '/security',
};


/* ------------------------------------------------------------
   ROLE DISPLAY ORDER
   ------------------------------------------------------------ */

export const PUBLIC_ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
}[] = [
  {
    value: 'student',
    label: 'Student',
    description:
      'For enrolled college students.',
  },
  {
    value: 'staff',
    label: 'College Staff',
    description:
      'For faculty and authorized staff.',
  },
  {
    value: 'other',
    label: 'Other / Outsider',
    description:
      'For visitors, parents, vendors and external users.',
  },
];


/* ------------------------------------------------------------
   TYPE GUARDS
   ------------------------------------------------------------ */

export function isUserRole(
  value: unknown,
): value is UserRole {
  return (
    value === 'student' ||
    value === 'staff' ||
    value === 'other' ||
    value === 'admin' ||
    value === 'security'
  );
}


export function isAccessType(
  value: unknown,
): value is AccessType {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(
      ACCESS_TYPE_LABELS,
      value,
    )
  );
}


/* ------------------------------------------------------------
   NORMALIZATION
   ------------------------------------------------------------ */

/**
 * Never trust a client-supplied invalid role.
 *
 * Invalid/unknown public role values become `other`,
 * rather than silently creating an administrator.
 */
export function normalizeUserRole(
  value: unknown,
): UserRole {
  if (isUserRole(value)) {
    return value;
  }

  return 'other';
}


export function normalizeAccessType(
  value: unknown,
): AccessType | null {
  return isAccessType(value)
    ? value
    : null;
}

/* ============================================================
   LEGACY / PAGE COMPATIBILITY TYPES
   ============================================================ */

export type Role = UserRole;

export type EntryType =
  | 'student_temporary_access'
  | 'parent_guardian'
  | 'visitor'
  | 'external_faculty'
  | 'maintenance'
  | 'delivery'
  | 'event'
  | 'restricted_lab'
  | 'vehicle_parking'
  | 'after_hours'
  | 'other_authorized';

export interface User {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  role: UserRole;
  account_status?: AccountStatus;
  student_id?: string | null;
  department?: string | null;
  semester?: number | null;
  program?: string | null;
  batch?: string | null;
  college?: string | null;
  staff_id?: string | null;
  designation?: string | null;
  organization?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  id_card_image?: string | null;
  show_photo_on_token?: boolean;
  show_name_on_token?: boolean;
  show_public_details?: boolean;
  requested_role?: UserRole | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SignUpData {
  full_name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  student_id?: string | null;
  department?: string | null;
  semester?: number | null;
  program?: string | null;
  staff_id?: string | null;
  designation?: string | null;
  organization?: string | null;
  college?: string | null;
  batch?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  id_card_image?: string | null;
  show_photo_on_token?: boolean;
  show_name_on_token?: boolean;
  show_public_details?: boolean;
  requested_role?: UserRole | null;
}

export interface RequestTokenData {
  visitor_name: string;
  visitor_mobile: string;
  entry_type: EntryType;
  purpose: string;
  date: string;
  entry_time: string;
  exit_time: string;
  location: string;
  vehicle_number?: string | null;
  notes?: string | null;
  organization?: string | null;
  student_name?: string | null;
  student_id_no?: string | null;
  student_department?: string | null;
  student_semester?: number | null;
  face_image_path?: string | null;
}

export interface TokenRequest {
  id: string;
  token_id: string;
  user_id: string;
  role: UserRole;
  request_type: EntryType;
  entry_type: EntryType;
  visitor_name: string;
  visitor_mobile: string;
  organization?: string | null;
  purpose: string;
  date: string;
  entry_time: string;
  exit_time: string;
  location: string;
  vehicle_number?: string | null;
  notes?: string | null;
  student_name?: string | null;
  student_id_no?: string | null;
  student_department?: string | null;
  student_semester?: number | null;
  face_image_path?: string | null;
  status: TokenStatus;
  admin_remark?: string;
  paid: boolean;
  payment_amount: number;
  face_captured_at?: string | null;
  created_at: string;
  updated_at?: string;
  token_kind?: 'standard' | 'temporary_guest';
}

export interface TokenHistoryEntry {
  id: string;
  token_id: string;
  user_id: string;
  action: string;
  action_by: string;
  timestamp: string;
}


export type FeedbackType =
  | 'problem'
  | 'token_issue'
  | 'payment_issue'
  | 'suggestion'
  | 'other';

export interface Feedback {
  id: string;
  user_id: string;
  feedback_type: FeedbackType;
  description: string | null;
  token_id: string | null;
  image_path: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  token_request_id: string;
  amount: number;
  payment_status: PaymentStatus;
  transaction_id?: string;
  currency?: string;
  payment_mode?: string | null;
  provider?: string | null;
  is_demo?: boolean;
  created_at: string;
}

// Older pages use a compact entry-log shape. Keep the richer fields optional.
export interface EntryLogCompat extends EntryLog {
  verified_by: string;
}

export type RoleChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RoleChangeRequest {
  id: string;
  user_id: string;
  current_role: UserRole;
  requested_role: UserRole;
  verification_email?: string | null;
  verification_method?: 'college_email' | 'id_card' | 'standard' | null;
  id_card_image?: string | null;
  reason?: string | null;
  status: RoleChangeRequestStatus;
  admin_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}
