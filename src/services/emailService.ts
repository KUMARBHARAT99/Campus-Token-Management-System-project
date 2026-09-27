import { getSupabase } from './supabaseClient';

/**
 * Sends the branded one-page campus-token PDF as an attachment.
 * The PDF is generated server-side by the Supabase Edge Function so the
 * browser never handles provider secrets.
 */
export async function sendTokenEmail(tokenRequestId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.functions.invoke('send-token-email', {
    body: { token_request_id: tokenRequestId },
  });

  if (!error) return;

  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    try {
      const payload = (await context.clone().json()) as { error?: unknown };
      if (typeof payload?.error === 'string' && payload.error.trim()) {
        throw new Error(payload.error);
      }
    } catch (responseError) {
      if (
        responseError instanceof Error &&
        responseError.message &&
        !responseError.message.toLowerCase().includes('unexpected token')
      ) {
        throw responseError;
      }
    }
  }

  throw new Error(error.message || 'Unable to send token email.');
}
