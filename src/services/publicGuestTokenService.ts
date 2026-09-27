import { getSupabase } from './supabaseClient';

export async function createTemporaryGuestToken(payload: Record<string, unknown>): Promise<{ tokenId: string }> {
  const { data, error } = await getSupabase().functions.invoke('create-temporary-guest-token', { body: payload });
  if (error) throw new Error(error.message);
  if (!data?.token_id) throw new Error(data?.error || 'Temporary guest token could not be created.');
  return { tokenId: String(data.token_id) };
}
