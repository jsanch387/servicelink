import { createClient } from '@supabase/supabase-js';
import type { Database } from './client';

/**
 * Server-only Supabase client with secret key (service role).
 * Bypasses RLS. Use only in API routes or server code for system actions
 * (e.g. creating a notification for a user when they are not the caller).
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  /** Supabase “service role” secret (bypasses RLS). Support both env names. */
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !secretKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and a service key (set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY)'
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false },
  });
}
