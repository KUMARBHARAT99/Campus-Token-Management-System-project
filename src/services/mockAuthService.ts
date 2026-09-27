import type { SignUpData, User } from '@/types';
import { generateId, getDB, persist } from '@/data/mockStore';
import { isSupabaseConfigured } from '@/config/supabase';
import { ADMIN_EMAIL } from '@/config/constants';

// Mock authentication service.
// Mirrors a real Supabase auth client so it can be replaced later.

const SESSION_KEY = 'sctms_session';

function stripPassword(user: User & { password: string }): User {
  const { password: _password, ...rest } = user;
  void _password;
  return rest;
}

export const mockAuthService = {
  async signUp(data: SignUpData): Promise<User> {
    const db = getDB();
    const exists = db.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) throw new Error('An account with this email already exists.');

    // Nobody can sign up as admin or security through the public form.
    const role = (data.role === 'admin' || data.role === 'security') ? 'other' : data.role;

    const user: User & { password: string } = {
      id: generateId('usr'),
      full_name: data.full_name,
      email: data.email,
      mobile: data.mobile,
      role,
      account_status: 'pending_approval',
      student_id: data.student_id,
      department: data.department,
      semester: data.semester,
      staff_id: data.staff_id,
      designation: data.designation,
      organization: data.organization,
      password: data.password,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    persist(db);

    const safe = stripPassword(user);
    // In mock mode, auto-login the new user (they see pending approval screen).
    localStorage.setItem(SESSION_KEY, safe.id);
    return safe;
  },

  async signIn(email: string, password: string): Promise<User> {
    const db = getDB();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) throw new Error('Invalid email or password.');
    const safe = stripPassword(user);
    localStorage.setItem(SESSION_KEY, safe.id);
    return safe;
  },

  async signOut(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    const db = getDB();
    const user = db.users.find((u) => u.id === id);
    return user ? stripPassword(user) : null;
  },

  updateProfile(userId: string, updates: Partial<User>): User {
    const db = getDB();
    const idx = db.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found.');
    // Never allow role or account_status changes from profile update
    const { role: _r, account_status: _s, ...safe } = updates;
    void _r;
    void _s;
    db.users[idx] = { ...db.users[idx], ...safe, updated_at: new Date().toISOString() };
    persist(db);
    return stripPassword(db.users[idx]);
  },

  changePassword(userId: string, currentPassword: string, newPassword: string): void {
    const db = getDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.password !== currentPassword) throw new Error('Current password is incorrect.');
    user.password = newPassword;
    persist(db);
  },

  getAllUsers(): User[] {
    return getDB().users.map(stripPassword);
  },

  approveUser(userId: string): User {
    const db = getDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.account_status = 'approved';
    persist(db);
    return stripPassword(user);
  },

  rejectUser(userId: string): User {
    const db = getDB();
    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found.');
    user.account_status = 'rejected';
    persist(db);
    return stripPassword(user);
  },

  isMockMode(): boolean {
    return !isSupabaseConfigured();
  },

  getAdminEmail(): string {
    return ADMIN_EMAIL;
  },
};
