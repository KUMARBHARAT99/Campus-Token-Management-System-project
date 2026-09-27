// Token service abstraction.
// Pages import from HERE — never from mock/supabase directly.

import type {
  EntryLog,
  RequestTokenData,
  TokenHistoryEntry,
  TokenRequest,
  TokenStatus,
  User,
} from '@/types';
import { isSupabaseConfigured } from '@/config/supabase';
import { mockTokenService } from './mockTokenService';
import { supabaseTokenService } from './supabaseTokenService';

export interface TokenService {
  createRequest(
    userId: string,
    data: RequestTokenData,
  ): Promise<{ request: TokenRequest; paymentRequired: boolean; fee: number }>;
  markPaid(userId: string, requestId: string, paymentMode?: string): Promise<TokenRequest>;
  getPayments(userId: string): Promise<import('@/types').Payment[]>;
  attachFaceImage(userId: string, requestId: string, path: string): Promise<TokenRequest>;
  getFaceImageUrl(userId: string | null, path: string): Promise<string>;
  getByUser(userId: string): Promise<TokenRequest[]>;
  getAll(): Promise<TokenRequest[]>;
  getById(id: string): Promise<TokenRequest | undefined>;
  getByTokenId(tokenId: string): Promise<TokenRequest | undefined>;
  updateStatus(requestId: string, status: TokenStatus, adminRemark: string, admin: User): Promise<TokenRequest>;
  cancel(requestId: string, user: User): Promise<TokenRequest>;
  getHistoryByUser(userId: string): Promise<TokenHistoryEntry[]>;
  getHistoryByToken(tokenId: string): Promise<TokenHistoryEntry[]>;
  getFreeUsage(userId: string): Promise<{ used: number; remaining: number }>;
  allowEntry(tokenId: string, verifiedBy: User, location?: string): Promise<{ request: TokenRequest; log: EntryLog }>;
  markExit(tokenId: string, verifiedBy: User, location?: string): Promise<{ request: TokenRequest; log: EntryLog }>;
  adminUpdateToken(requestId: string, updates: Record<string, unknown>, admin: User): Promise<TokenRequest>;
  adminDeleteToken(requestId: string, admin: User): Promise<void>;
  rejectEntry(tokenId: string, verifiedBy: User): Promise<EntryLog>;
  getEntryLogs(): Promise<EntryLog[]>;
}

// Wrap sync mock methods to return Promises.
const mockAdapter: TokenService = {
  async createRequest(userId, data) {
    return mockTokenService.createRequest(userId, data);
  },
  async markPaid(userId, requestId, paymentMode) {
    return mockTokenService.markPaid(userId, requestId, paymentMode);
  },
  async getPayments(userId) {
    return mockTokenService.getPayments(userId);
  },
  async attachFaceImage(userId, requestId, path) {
    return mockTokenService.attachFaceImage(userId, requestId, path);
  },
  async getFaceImageUrl(userId, path) {
    return mockTokenService.getFaceImageUrl(userId, path);
  },
  async getByUser(userId) {
    return mockTokenService.getByUser(userId);
  },
  async getAll() {
    return mockTokenService.getAll();
  },
  async getById(id) {
    return mockTokenService.getById(id);
  },
  async getByTokenId(tokenId) {
    return mockTokenService.getByTokenId(tokenId);
  },
  async updateStatus(requestId, status, adminRemark, admin) {
    return mockTokenService.updateStatus(requestId, status, adminRemark, admin);
  },
  async cancel(requestId, user) {
    return mockTokenService.cancel(requestId, user);
  },
  async getHistoryByUser(userId) {
    return mockTokenService.getHistoryByUser(userId);
  },
  async getHistoryByToken(tokenId) {
    return mockTokenService.getHistoryByToken(tokenId);
  },
  async getFreeUsage(userId) {
    return mockTokenService.getFreeUsage(userId);
  },
  async allowEntry(tokenId, verifiedBy, location) {
    return mockTokenService.allowEntry(tokenId, verifiedBy, location);
  },
  async markExit(tokenId, verifiedBy, location) {
    return mockTokenService.markExit(tokenId, verifiedBy, location);
  },
  async adminUpdateToken(requestId, updates, admin) { return mockTokenService.adminUpdateToken(requestId, updates, admin); },
  async adminDeleteToken(requestId, admin) { return mockTokenService.adminDeleteToken(requestId, admin); },
  async rejectEntry(tokenId, verifiedBy) {
    return mockTokenService.rejectEntry(tokenId, verifiedBy);
  },
  async getEntryLogs() {
    return mockTokenService.getEntryLogs();
  },
};

function resolve(): TokenService {
  return isSupabaseConfigured() ? supabaseTokenService : mockAdapter;
}

export const tokenService: TokenService = {
  createRequest: (userId, data) => resolve().createRequest(userId, data),
  markPaid: (userId, requestId, paymentMode) => resolve().markPaid(userId, requestId, paymentMode),
  getPayments: (userId) => resolve().getPayments(userId),
  attachFaceImage: (userId, requestId, path) => resolve().attachFaceImage(userId, requestId, path),
  getFaceImageUrl: (userId, path) => resolve().getFaceImageUrl(userId, path),
  getByUser: (userId) => resolve().getByUser(userId),
  getAll: () => resolve().getAll(),
  getById: (id) => resolve().getById(id),
  getByTokenId: (tokenId) => resolve().getByTokenId(tokenId),
  updateStatus: (requestId, status, adminRemark, admin) =>
    resolve().updateStatus(requestId, status, adminRemark, admin),
  cancel: (requestId, user) => resolve().cancel(requestId, user),
  getHistoryByUser: (userId) => resolve().getHistoryByUser(userId),
  getHistoryByToken: (tokenId) => resolve().getHistoryByToken(tokenId),
  getFreeUsage: (userId) => resolve().getFreeUsage(userId),
  allowEntry: (tokenId, verifiedBy, location) => resolve().allowEntry(tokenId, verifiedBy, location),
  markExit: (tokenId, verifiedBy, location) => resolve().markExit(tokenId, verifiedBy, location),
  adminUpdateToken: (requestId, updates, admin) => resolve().adminUpdateToken(requestId, updates, admin),
  adminDeleteToken: (requestId, admin) => resolve().adminDeleteToken(requestId, admin),
  rejectEntry: (tokenId, verifiedBy) => resolve().rejectEntry(tokenId, verifiedBy),
  getEntryLogs: () => resolve().getEntryLogs(),
};
