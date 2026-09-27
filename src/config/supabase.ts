import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL as string | undefined;

const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function getRequiredEnv(
  name: string,
  value: string | undefined
): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `[Supabase] Missing ${name}. Check your .env file and restart Vite.`
    );
  }

  return value.trim();
}

export const SUPABASE_URL = getRequiredEnv(
  'VITE_SUPABASE_URL',
  supabaseUrl
);

export const SUPABASE_ANON_KEY = getRequiredEnv(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  publishableKey || anonKey
);

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
console.log('[SUPABASE DEBUG]', {
  url: SUPABASE_URL,
  keyExists: Boolean(SUPABASE_ANON_KEY),
  urlHost: (() => {
    try {
      return new URL(SUPABASE_URL).host;
    } catch {
      return 'INVALID_URL';
    }
  })(),
});
/*
 * ONE CENTRAL SUPABASE CLIENT
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },

    global: {
      headers: {
        'x-client-info':
          'smart-campus-token-management-system',
      },
    },
  }
);

export function getSupabaseErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    const message = (error as {
      message?: unknown;
    }).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return 'An unexpected Supabase authentication or database error occurred.';
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY
  );
}

export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const { error } =
      await supabase.auth.getSession();

    if (error) {
      return {
        ok: false,
        message: getSupabaseErrorMessage(error),
      };
    }

    return {
      ok: true,
      message:
        'Supabase client connected successfully.',
    };
  } catch (error) {
    return {
      ok: false,
      message: getSupabaseErrorMessage(error),
    };
  }
}