import { getSupabase } from './supabaseClient';

export async function sendApprovalRequest(userId: string): Promise<{ alreadySent: boolean; message: string }> {
  const { data, error } = await getSupabase().functions.invoke('send-approval-request', { body: { user_id: userId } });
  if (error) throw new Error(data?.error || error.message);
  if (data?.error) throw new Error(String(data.error));
  return { alreadySent: Boolean(data?.already_sent), message: String(data?.message || 'Approval request sent to Admin.') };
}
