import { getSupabase } from './supabaseClient';

// Prevent duplicate sends caused by rapid double-clicks in the same browser session.
const inFlightSmsRequests = new Set<string>();

export async function sendTokenSms(
  tokenRequestId: string,
): Promise<void> {
  if (inFlightSmsRequests.has(tokenRequestId)) {
    throw new Error('SMS is already being sent for this token. Please wait.');
  }

  inFlightSmsRequests.add(tokenRequestId);
  const supabase = getSupabase();

  try {
    const { data, error } =
    await supabase.functions.invoke('send-token-sms', {
      body: {
        token_request_id: tokenRequestId,
      },
    });

    // Supabase Edge Function itself failed
    if (error) {
      throw new Error(error.message);
    }

    // TextBee/provider failed
    if (!data?.ok) {
      let providerError = 'SMS delivery failed.';

      if (typeof data?.error === 'string') {
        providerError = data.error;
      } else if (data?.error) {
        try {
          providerError = JSON.stringify(data.error);
        } catch {
          providerError = 'TextBee returned an unknown error.';
        }
      }

      const providerStatus = data?.provider_status
        ? ` (TextBee status ${data.provider_status})`
        : '';

      throw new Error(`${providerError}${providerStatus}`);
    }

    return;
  } finally {
    inFlightSmsRequests.delete(tokenRequestId);
  }
}