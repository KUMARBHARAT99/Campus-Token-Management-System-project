import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, getSupabaseErrorMessage } from '@/config/supabase';
import type { AccountStatus, UserRole } from '@/types';

const RESERVED_ADMIN_EMAIL = 'kumarbharat.ac.in@gmail.com';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  full_name: string;
  mobile: string;
  student_id?: string | null;
  semester?: number | null;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  studentId?: string | null;
  department?: string | null;
  employeeId?: string | null;
  organization?: string | null;
  designation?: string | null;
  program?: string | null;
  batch?: string | null;
  college?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  bio?: string | null;
  idCardImage?: string | null;
  showPhotoOnToken?: boolean;
  showNameOnToken?: boolean;
  showPublicDetails?: boolean;
  requestedRole?: UserRole | null;
  accountStatus?: AccountStatus;
  isVerified?: boolean;
  faceEnrolled?: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | string | null;
  phone: string | null;
  mobile?: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  account_status?: AccountStatus | string | null;
  student_id?: string | null;
  department?: string | null;
  employee_id?: string | null;
  staff_id?: string | null;
  designation?: string | null;
  program?: string | null;
  organization?: string | null;
  batch?: string | null;
  college?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  city?: string | null;
  bio?: string | null;
  id_card_image?: string | null;
  show_photo_on_token?: boolean;
  show_name_on_token?: boolean;
  show_public_details?: boolean;
  semester?: number | null;
  is_verified?: boolean | null;
  face_enrolled?: boolean | null;
  requested_role?: UserRole | string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type StudentRow = {
  student_id: string;
  profile_id: string | null;
  semester: number | null;
  status: 'active' | 'inactive' | 'suspended' | 'graduated';
};

export type SignupProfileData = {
  fullName: string;
  role: UserRole;
  phone?: string | null;
  studentId?: string | null;
  department?: string | null;
  employeeId?: string | null;
  organization?: string | null;
  designation?: string | null;
  program?: string | null;
  batch?: string | null;
  college?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  city?: string | null;
  bio?: string | null;
  idCardImage?: string | null;
  showPhotoOnToken?: boolean;
  showNameOnToken?: boolean;
  showPublicDetails?: boolean;
  semester?: number | null;
  accessType?: string | null;
  idVerificationScore?: number | null;
  idVerificationText?: string | null;
  requestedRole?: UserRole | null;
};

type AppContextValue = {
  currentUser: AppUser | null;
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  signInWithEmail: (email: string, password: string) => Promise<AppUser>;
  signup: (email: string, password: string, profileData?: SignupProfileData) => Promise<SupabaseUser>;
  signUpWithEmail: (email: string, password: string, profileData?: SignupProfileData) => Promise<SupabaseUser>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Record<string, unknown>) => Promise<AppUser | null>;
  refreshUser: () => Promise<AppUser | null>;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<SupabaseUser>;
  sendEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string, type?: 'signup' | 'email') => Promise<SupabaseUser>;
  completePhoneOnboarding: (data: SignupProfileData) => Promise<AppUser | null>;
  isAuthenticated: boolean;
  isStudent: boolean;
  isStaff: boolean;
  isOther: boolean;
  isSecurity: boolean;
  isAdmin: boolean;
  isCollegeUser: boolean;
  isOutsider: boolean;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

function normalizeRole(value: unknown): UserRole {
  if (value === 'student' || value === 'staff' || value === 'other' || value === 'admin' || value === 'security') {
    return value;
  }
  return 'other';
}

function normalizeAccountStatus(value: unknown): AccountStatus {
  if (
    value === 'pending' ||
    value === 'pending_approval' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'suspended' ||
    value === 'active'
  ) {
    return value;
  }
  return 'active';
}

function toAppUser(profile: ProfileRow, authUser: SupabaseUser, student?: StudentRow | null): AppUser {
  const fullName =
    profile.full_name?.trim() ||
    authUser.user_metadata?.full_name?.trim() ||
    authUser.user_metadata?.name?.trim() ||
    authUser.email?.split('@')[0] ||
    'User';

  const phone = profile.phone || profile.mobile || authUser.phone || '';
  const studentId = student?.student_id ?? profile.student_id ?? null;
  const semester = student?.semester ?? profile.semester ?? null;

  return {
    id: profile.id,
    email: profile.email || authUser.email || '',
    name: fullName,
    full_name: fullName,
    mobile: phone,
    student_id: studentId,
    semester,
    role: normalizeRole(profile.role),
    phone: phone || null,
    avatarUrl: profile.avatar_url || authUser.user_metadata?.avatar_url || null,
    isActive: profile.is_active !== false,
    studentId,
    department: profile.department ?? null,
    employeeId: profile.employee_id ?? profile.staff_id ?? null,
    organization: profile.organization ?? null,
    designation: profile.designation ?? null,
    program: profile.program ?? null,
    batch: profile.batch ?? null,
    college: profile.college ?? null,
    gender: profile.gender ?? null,
    dateOfBirth: profile.date_of_birth ?? null,
    city: profile.city ?? null,
    bio: profile.bio ?? null,
    idCardImage: profile.id_card_image ?? null,
    showPhotoOnToken: profile.show_photo_on_token ?? true,
    showNameOnToken: profile.show_name_on_token ?? true,
    showPublicDetails: profile.show_public_details ?? false,
    requestedRole: profile.requested_role ? normalizeRole(profile.requested_role) : null,
    accountStatus: normalizeAccountStatus(profile.account_status),
    isVerified: profile.is_verified ?? false,
    faceEnrolled: profile.face_enrolled ?? false,
    created_at: profile.created_at || authUser.created_at || new Date().toISOString(),
  };
}

async function fetchProfile(authUser: SupabaseUser): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw new Error(`Unable to load your profile: ${getSupabaseErrorMessage(error)}`);
  return (data as ProfileRow | null) ?? null;
}

async function ensureProfile(authUser: SupabaseUser): Promise<ProfileRow> {
  let profile = await fetchProfile(authUser);
  if (profile) return profile;

  // This RPC is SECURITY DEFINER and repairs older Auth accounts that were
  // created before the profile trigger/policies were installed.
  const { error: rpcError } = await supabase.rpc('ensure_my_profile');
  if (rpcError) {
    // Fallback for a database where the RPC has not been installed yet.
    const metadata = authUser.user_metadata ?? {};
    const role = normalizeRole(metadata.role);
    const payload = {
      id: authUser.id,
      full_name: String(metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User'),
      email: String(authUser.email || `${authUser.phone || authUser.id}@phone.local`).toLowerCase(),
      phone: metadata.phone || authUser.phone || null,
      mobile: metadata.phone || authUser.phone || null,
      role: role === 'admin' || role === 'security' ? 'other' : role,
      is_active: true,
      account_status: 'pending_approval',
      student_id: metadata.student_id || null,
      department: metadata.department || null,
      semester: metadata.semester ? Number(metadata.semester) : null,
      staff_id: metadata.staff_id || metadata.employee_id || null,
      employee_id: metadata.employee_id || metadata.staff_id || null,
      designation: metadata.designation || null,
      organization: metadata.organization || null,
    };
    const { error: insertError } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (insertError) {
      throw new Error(`Your account exists, but the campus profile could not be created: ${getSupabaseErrorMessage(insertError)}`);
    }
  }

  profile = await fetchProfile(authUser);
  if (!profile) {
    throw new Error('Your account exists, but the campus profile was not found. Please contact administration.');
  }
  return profile;
}

async function loadApplicationUser(authUser: SupabaseUser): Promise<AppUser> {
  let profile = await ensureProfile(authUser);

  // Preserve the role selected before Google OAuth. This RPC only accepts
  // public roles and cannot modify an already approved/privileged account.
  if ((profile.account_status === 'pending' || profile.account_status === 'pending_approval') && typeof window !== 'undefined') {
    const selectedRole = window.localStorage.getItem('smart_campus_selected_role');
    if (selectedRole === 'admin' || selectedRole === 'security') {
      window.localStorage.removeItem('smart_campus_selected_role');
      await supabase.auth.signOut();
      throw new Error('Admin and Security accounts must be provisioned by the campus administrator.');
    }
    if (selectedRole === 'student' || selectedRole === 'staff' || selectedRole === 'other') {
      const { data } = await supabase.rpc('set_initial_role', { p_role: selectedRole });
      if (data) profile = data as ProfileRow;
      window.localStorage.removeItem('smart_campus_selected_role');
    }
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut();
    throw new Error('Your account is inactive. Please contact the administrator.');
  }

  const status = normalizeAccountStatus(profile.account_status);
  if (status === 'rejected') {
    await supabase.auth.signOut();
    throw new Error('Your account registration was rejected by the administrator.');
  }
  if (status === 'suspended') {
    await supabase.auth.signOut();
    throw new Error('Your account has been suspended. Please contact the administrator.');
  }

  let student: StudentRow | null = null;
  if (normalizeRole(profile.role) === 'student') {
    const { data, error } = await supabase
      .from('students')
      .select('student_id, profile_id, semester, status')
      .eq('profile_id', authUser.id)
      .maybeSingle();

    if (error) throw new Error(`Unable to load student information: ${getSupabaseErrorMessage(error)}`);
    student = (data as StudentRow | null) ?? null;

    // Older accounts may have profile.student_id but no students row.
    // Do not block login; the profile remains the source of truth.
    if (student && student.status !== 'active') {
      await supabase.auth.signOut();
      throw new Error(`Student account is ${student.status}. Please contact the administrator.`);
    }
  }

  return toAppUser(profile, authUser, student);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshUser = useCallback(async (): Promise<AppUser | null> => {
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      setSession(data.session);

      if (!data.session?.user) {
        setCurrentUser(null);
        return null;
      }

      const appUser = await loadApplicationUser(data.session.user);
      setCurrentUser(appUser);
      setError(null);
      return appUser;
    } catch (err) {
      setCurrentUser(null);
      setError(getSupabaseErrorMessage(err));
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void refreshUser().finally(() => {
      if (mounted) setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);

      if (!nextSession?.user || event === 'SIGNED_OUT') {
        setCurrentUser(null);
        if (event === 'SIGNED_OUT') setError(null);
        setLoading(false);
        return;
      }

      // Defer the profile query so auth state callbacks never get blocked by
      // another Supabase auth call in the same callback.
      window.setTimeout(() => {
        if (!mounted || !nextSession.user) return;
        void loadApplicationUser(nextSession.user)
          .then((appUser) => {
            if (!mounted) return;
            setCurrentUser(appUser);
            setError(null);
          })
          .catch((err) => {
            if (!mounted) return;
            setCurrentUser(null);
            setError(getSupabaseErrorMessage(err));
          })
          .finally(() => {
            if (mounted) setLoading(false);
          });
      }, 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<AppUser> => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('Email and password are required.');

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (signInError) {
      const message = getSupabaseErrorMessage(signInError);
      setError(message);
      throw new Error(message);
    }
    if (!data.user || !data.session) {
      const message = 'Login failed. No active session was created.';
      setError(message);
      throw new Error(message);
    }

    try {
      const appUser = await loadApplicationUser(data.user);

      const status = normalizeAccountStatus(appUser.accountStatus);
      if (status === 'pending' || status === 'pending_approval') {
        await supabase.auth.signOut();
        const message =
          'Your account is awaiting administrator approval. Please try logging in after your account is approved.';
        setError(message);
        throw new Error(message);
      }

      setSession(data.session);
      setCurrentUser(appUser);
      return appUser;
    } catch (err) {
      const message = getSupabaseErrorMessage(err);
      setError(message);
      // Do not sign out just because profile repair failed; this keeps the
      // Auth account recoverable and lets the user retry after DB repair.
      throw new Error(message);
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    profileData?: SignupProfileData,
  ): Promise<SupabaseUser> => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) throw new Error('Email and password are required.');
    if (password.length < 8) throw new Error('Password must contain at least 8 characters.');

    const role = normalizeRole(profileData?.role);
    if (role === 'admin' || role === 'security') {
      throw new Error('Administrator and Security accounts cannot be created through public registration.');
    }

    const fullName = profileData?.fullName?.trim() || normalizedEmail.split('@')[0];
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          role,
          requested_role: profileData?.requestedRole ?? role,
          phone: profileData?.phone ?? null,
          student_id: profileData?.studentId ?? null,
          department: profileData?.department ?? null,
          semester: profileData?.semester ?? null,
          employee_id: profileData?.employeeId ?? null,
          staff_id: profileData?.employeeId ?? null,
          organization: profileData?.organization ?? null,
          designation: profileData?.designation ?? null,
          program: profileData?.program ?? null,
          batch: profileData?.batch ?? null,
          college: profileData?.college ?? null,
          gender: profileData?.gender ?? null,
          date_of_birth: profileData?.dateOfBirth ?? null,
          city: profileData?.city ?? null,
          bio: profileData?.bio ?? null,
          show_photo_on_token: profileData?.showPhotoOnToken ?? true,
          show_name_on_token: profileData?.showNameOnToken ?? true,
          show_public_details: profileData?.showPublicDetails ?? false,
          access_type: profileData?.accessType ?? null,
        },
      },
    });

    if (signUpError || !data.user) {
      const message = signUpError ? getSupabaseErrorMessage(signUpError) : 'Unable to create your account.';
      setError(message);
      throw new Error(message);
    }

    if (data.session) {
      setSession(data.session);
      try {
        const appUser = await loadApplicationUser(data.user);
        setCurrentUser(appUser);
      } catch (err) {
        setError(getSupabaseErrorMessage(err));
        throw err instanceof Error ? err : new Error('Profile creation failed.');
      }
    }

    return data.user;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (authError) {
      const message = getSupabaseErrorMessage(authError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const sendEmailOtp = useCallback(async (email: string) => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new Error('An email address is required.');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/` },
    });
    if (otpError) {
      const message = getSupabaseErrorMessage(otpError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const verifyEmailOtp = useCallback(async (email: string, token: string, type: 'signup' | 'email' = 'email'): Promise<SupabaseUser> => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const cleanToken = token.replace(/\D/g, '').slice(0, 10);
    const { data, error: verificationError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: cleanToken,
      type,
    });
    if (verificationError || !data.user || !data.session) {
      const message = verificationError ? getSupabaseErrorMessage(verificationError) : 'The email OTP could not be verified.';
      setError(message);
      throw new Error(message);
    }
    setSession(data.session);
    try {
      const appUser = await loadApplicationUser(data.user);
      setCurrentUser(appUser);
    } catch (err) {
      const message = getSupabaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
    return data.user;
  }, []);

  const completePhoneOnboarding = useCallback(async (data: SignupProfileData): Promise<AppUser | null> => {
    setError(null);
    const role = normalizeRole(data.role);
    if (role === 'admin' || role === 'security') throw new Error('Administrator and security accounts cannot be created through phone onboarding.');
    const { error: onboardingError } = await supabase.rpc('complete_phone_onboarding', {
      p_full_name: data.fullName?.trim(),
      p_requested_role: data.requestedRole ?? role,
      p_phone: data.phone?.trim() ?? null,
      p_student_id: data.studentId ?? null,
      p_department: data.department ?? null,
      p_semester: data.semester ?? null,
      p_program: data.program ?? null,
      p_employee_id: data.employeeId ?? null,
      p_designation: data.designation ?? null,
      p_organization: data.organization ?? null,
      p_access_type: data.accessType ?? null,
    });
    if (onboardingError) {
      const message = getSupabaseErrorMessage(onboardingError);
      setError(message);
      throw new Error(message);
    }
    return refreshUser();
  }, [refreshUser]);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    setError(null);
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) throw new Error('A mobile number is required.');
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      const message = getSupabaseErrorMessage(otpError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string): Promise<SupabaseUser> => {
    setError(null);
    const { data, error: verificationError } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: token.trim(),
      type: 'sms',
    });
    if (verificationError || !data.user || !data.session) {
      const message = verificationError ? getSupabaseErrorMessage(verificationError) : 'The OTP could not be verified.';
      setError(message);
      throw new Error(message);
    }
    setSession(data.session);
    // Phone users complete their profile after OTP. Existing users are loaded by the page after verification.
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      const message = getSupabaseErrorMessage(signOutError);
      setError(message);
      throw new Error(message);
    }
    setSession(null);
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Record<string, unknown>) => {
    if (!currentUser) return null;
    setError(null);
    const allowed = new Set(['full_name','mobile','phone','department','semester','program','batch','college','employee_id','staff_id','designation','gender','date_of_birth','city','bio','avatar_url','show_photo_on_token','show_name_on_token','show_public_details']);
    const payload: Record<string, unknown> = {};
    Object.entries(updates).forEach(([key,value]) => { if (allowed.has(key)) payload[key] = value; });
    if (updates.mobile !== undefined) payload.phone = updates.mobile;
    payload.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', currentUser.id);

    if (updateError) {
      const message = getSupabaseErrorMessage(updateError);
      setError(message);
      throw new Error(message);
    }
    return refreshUser();
  }, [currentUser, refreshUser]);

  const isAuthenticated = Boolean(currentUser && session);
  const isStudent = currentUser?.role === 'student';
  const isStaff = currentUser?.role === 'staff';
  const isOther = currentUser?.role === 'other';
  const isSecurity = currentUser?.role === 'security';
  const isAdmin = currentUser?.role === 'admin';
  const isCollegeUser = isStudent || isStaff;
  const isOutsider = isOther;
  const needsOnboarding = Boolean(session && !currentUser);

  const value = useMemo<AppContextValue>(() => ({
    currentUser,
    user: currentUser,
    session,
    loading,
    error,
    needsOnboarding,
    login,
    signInWithEmail: login,
    signup,
    signUpWithEmail: signup,
    logout,
    signOut: logout,
    updateUser,
    refreshUser,
    clearError,
    signInWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    sendEmailOtp,
    verifyEmailOtp,
    completePhoneOnboarding,
    isAuthenticated,
    isStudent,
    isStaff,
    isOther,
    isSecurity,
    isAdmin,
    isCollegeUser,
    isOutsider,
  }), [
    currentUser, session, loading, error, needsOnboarding, login, signup,
    logout, updateUser, refreshUser, clearError, signInWithGoogle,
    sendPhoneOtp, verifyPhoneOtp, sendEmailOtp, verifyEmailOtp, completePhoneOnboarding, isAuthenticated, isStudent, isStaff,
    isOther, isSecurity, isAdmin, isCollegeUser, isOutsider,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export function useAuth() {
  return useApp();
}

export const AuthProvider = AppProvider;
export { RESERVED_ADMIN_EMAIL };
