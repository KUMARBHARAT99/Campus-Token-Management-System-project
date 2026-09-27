import { getSupabase } from './supabaseClient';
import type { RoleChangeRequest, UserRole } from '@/types';

export async function submitRoleChangeRequest(data: {
  requestedRole: UserRole;
  verificationEmail?: string;
  verificationMethod: 'college_email' | 'id_card' | 'standard';
  idCardImage?: string | null;
  reason?: string;
}): Promise<RoleChangeRequest> {
  const { data: row, error } = await getSupabase().rpc('submit_role_change_request', {
    p_requested_role: data.requestedRole,
    p_verification_email: data.verificationEmail?.trim().toLowerCase() || null,
    p_verification_method: data.verificationMethod,
    p_id_card_image: data.idCardImage || null,
    p_reason: data.reason?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return row as RoleChangeRequest;
}

export async function getMyRoleChangeRequests(userId: string): Promise<RoleChangeRequest[]> {
  const { data, error } = await getSupabase()
    .from('role_change_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as RoleChangeRequest[];
}

export async function getAllRoleChangeRequests(): Promise<RoleChangeRequest[]> {
  const { data, error } = await getSupabase()
    .from('role_change_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as RoleChangeRequest[];
}

export async function reviewRoleChangeRequest(id: string, decision: 'approved' | 'rejected', note?: string): Promise<RoleChangeRequest> {
  const { data, error } = await getSupabase().rpc('review_role_change_request', {
    p_request_id: id,
    p_decision: decision,
    p_admin_note: note?.trim() || null,
  });
  if (error) throw new Error(error.message);
  return data as RoleChangeRequest;
}
