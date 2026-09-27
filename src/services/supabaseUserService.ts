// Supabase user service — delegates to profiles table.

import type { User } from '@/types';
import { supabaseAuthService } from './supabaseAuthService';

export const supabaseUserService = {
  async getCurrentUser(): Promise<User | null> {
    return supabaseAuthService.getCurrentUser();
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    return supabaseAuthService.updateProfile(userId, updates);
  },

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    return supabaseAuthService.changePassword(userId, current, next);
  },

  async getAllUsers(): Promise<User[]> {
    return supabaseAuthService.getAllUsers();
  },

  async approveUser(userId: string): Promise<User> { return supabaseAuthService.approveUser(userId); },
  async rejectUser(userId: string, reason?: string): Promise<User> { return supabaseAuthService.rejectUser(userId, reason); },
};
