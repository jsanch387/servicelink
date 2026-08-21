import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './client';
import {
  expireCookieOptions,
  sanitizeSupabaseAuthCookies,
} from './sanitizeAuthCookies';

// Server-side Supabase client (for use in server components and route handlers)
export const createSupabaseServerClient =
  async (): Promise<SupabaseClient<Database>> => {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieEncoding: 'raw',
        cookies: {
          getAll() {
            const { cookies: safeCookies, staleNames } =
              sanitizeSupabaseAuthCookies(cookieStore.getAll());
            if (staleNames.length > 0) {
              const expire = expireCookieOptions();
              staleNames.forEach(name => {
                try {
                  cookieStore.set(name, '', expire);
                } catch {
                  // Server Components cannot always write cookies.
                }
              });
            }
            return safeCookies;
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // In Server Components, Next.js can disallow cookie writes.
                // Route handlers and middleware still handle writable cookie flows.
              }
            });
          },
        },
      }
    );
  };

// Server-side Supabase client for middleware
export const createSupabaseMiddlewareClient = (
  supabaseUrl: string,
  supabaseAnonKey: string,
  cookieOptions: {
    get: (name: string) => string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    set: (name: string, value: string, options: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove: (name: string, options: any) => void;
  }
) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieEncoding: 'raw',
    cookies: cookieOptions,
  });
};
