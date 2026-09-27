// Auth service abstraction.
// Pages and hooks import from HERE — never from mock/supabase directly.
// Automatically selects Supabase or mock based on configuration.

import type { SignUpData, User } from '@/types';
import { isSupabaseConfigured } from '@/config/supabase';
import { mockAuthService } from './mockAuthService';
import { supabaseAuthService } from './supabaseAuthService';

export interface AuthService {
  signUp(data: SignUpData): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(userId: string, updates: Partial<User>): Promise<User>;
  changePassword(userId: string, current: string, next: string): Promise<void>;
  resetPasswordForEmail(email: string): Promise<void>;
  onAuthStateChange(callback: (user: User | null) => void): Promise<() => void>;
  getAllUsers(): Promise<User[]>;
  isMockMode(): boolean;
}

// The mock service has some sync methods; wrap them to match the async interface.
const mockAdapter: AuthService = {
  async signUp(data) {
    return mockAuthService.signUp(data);
  },
  async signIn(email, password) {
    return mockAuthService.signIn(email, password);
  },
  async signOut() {
    return mockAuthService.signOut();
  },
  async getCurrentUser() {
    return mockAuthService.getCurrentUser();
  },
  async updateProfile(userId, updates) {
    return mockAuthService.updateProfile(userId, updates);
  },
  async changePassword(userId, current, next) {
    mockAuthService.changePassword(userId, current, next);
  },
  async resetPasswordForEmail() {
    // Mock mode: no-op. The ForgotPasswordPage handles its own demo UI.
  },
  async onAuthStateChange() {
    // Mock mode has no auth state change events.
    return () => {};
  },
  async getAllUsers() {
    return mockAuthService.getAllUsers();
  },
  isMockMode() {
    return true;
  },
};

function resolve(): AuthService {
  return isSupabaseConfigured() ? supabaseAuthService : mockAdapter;
}

export const authService: AuthService = {
  signUp: (data) => resolve().signUp(data),
  signIn: (email, password) => resolve().signIn(email, password),
  signOut: () => resolve().signOut(),
  getCurrentUser: () => resolve().getCurrentUser(),
  updateProfile: (userId, updates) => resolve().updateProfile(userId, updates),
  changePassword: (userId, current, next) => resolve().changePassword(userId, current, next),
  resetPasswordForEmail: (email) => resolve().resetPasswordForEmail(email),
  onAuthStateChange: (cb) => resolve().onAuthStateChange(cb),
  getAllUsers: () => resolve().getAllUsers(),
  isMockMode: () => resolve().isMockMode(),
};
