import { createClient } from '@supabase/supabase-js';
import type { Database } from './client';

/**
 * Server-only Supabase client built from a raw access token (Authorization: Bearer ...).
 *
 * Used by API routes that need to authenticate non-cookie clients (e.g. the Expo
 * mobile app). The token is sent as the `Authorization` header on every request,
 * so `supabase.auth.getUser()` validates it against Supabase auth and queries
 * run under that user's RLS.
 *
 * Do not use this from server actions / server components — those have cookies
 * already and should keep using `createSupabaseServerClient()`.
 */
export function createSupabaseClientFromBearer(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
