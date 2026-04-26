import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from './client';

// Server-side Supabase client (for use in server components and route handlers)
export const createSupabaseServerClient =
  async (): Promise<SupabaseClient<Database>> => {
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
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
    set: (name: string, value: string, options: any) => void;
    remove: (name: string, options: any) => void;
  }
) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieOptions,
  });
};
