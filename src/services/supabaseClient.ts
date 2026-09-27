import { supabase } from '@/config/supabase';

/** Single shared Supabase client for the entire application. */
export function getSupabase() {
  return supabase;
}

export function resetSupabaseClient(): void {
  // The central client intentionally lives for the lifetime of the app.
  // Kept as a compatibility no-op for older imports.
}
