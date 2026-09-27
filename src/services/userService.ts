// User service abstraction.
// Pages import from HERE — never from mock/supabase directly.

import type { User } from '@/types';
import { isSupabaseConfigured } from '@/config/supabase';
import { mockUserService } from './mockUserService';
import { supabaseUserService } from './supabaseUserService';

export interface UserService {
  getCurrentUser(): Promise<User | null>;
  updateProfile(userId: string, updates: Partial<User>): Promise<User>;
  changePassword(userId: string, current: string, next: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  approveUser(userId: string): Promise<User>;
  rejectUser(userId: string, reason?: string): Promise<User>;
}

const mockAdapter: UserService = {
  async getCurrentUser() {
    return mockUserService.getCurrentUser();
  },
  async updateProfile(userId, updates) {
    return mockUserService.updateProfile(userId, updates);
  },
  async changePassword(userId, current, next) {
    mockUserService.changePassword(userId, current, next);
  },
  async getAllUsers() {
    return mockUserService.getAllUsers();
  },
  async approveUser(userId) { return mockUserService.approveUser(userId); },
  async rejectUser(userId, reason) { return mockUserService.rejectUser(userId, reason); },
};

function resolve(): UserService {
  return isSupabaseConfigured() ? supabaseUserService : mockAdapter;
}

export const userService: UserService = {
  getCurrentUser: () => resolve().getCurrentUser(),
  updateProfile: (userId, updates) => resolve().updateProfile(userId, updates),
  changePassword: (userId, current, next) => resolve().changePassword(userId, current, next),
  getAllUsers: () => resolve().getAllUsers(),
  approveUser: (userId) => resolve().approveUser(userId),
  rejectUser: (userId, reason) => resolve().rejectUser(userId, reason),
};
