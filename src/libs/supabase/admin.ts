import { createClient } from '@supabase/supabase-js';
import type { Database } from './client';

/**
 * Server-only Supabase client with secret key (service role).
 * Bypasses RLS. Use only in API routes or server code for system actions
 * (e.g. creating a notification for a user when they are not the caller).
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY'
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: { persistSession: false },
  });
}
