import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './client';

// Server-side Supabase client (for use in server components and middleware)
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
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
