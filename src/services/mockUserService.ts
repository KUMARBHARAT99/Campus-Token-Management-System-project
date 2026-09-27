import type { User } from '@/types';
import { mockAuthService } from './mockAuthService';

// User-related service — currently delegates to the mock auth store.
export const mockUserService = {
  getCurrentUser(): User | null {
    return mockAuthService.getCurrentUser();
  },

  updateProfile(userId: string, updates: Partial<User>): User {
    return mockAuthService.updateProfile(userId, updates);
  },

  changePassword(userId: string, current: string, next: string): void {
    return mockAuthService.changePassword(userId, current, next);
  },

  getAllUsers(): User[] {
    return mockAuthService.getAllUsers();
  },
  approveUser(userId: string): User { return mockAuthService.approveUser(userId); },
  rejectUser(userId: string, reason?: string): User { void reason; return mockAuthService.rejectUser(userId); },
};
