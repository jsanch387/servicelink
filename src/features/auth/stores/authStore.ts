'use client';

import { ROUTES } from '@/constants/routes';
import { ProfileService } from '@/features/profiles';
import { createClient } from '@/libs/supabase';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, AuthUser } from '../types/auth';

const initialState = {
  user: null,
  supabaseUser: null,
  isLoading: false,
  isInitialized: false,
};

async function startGoogleOAuthSignIn(
  setLoading: (loading: boolean) => void
): Promise<{ error?: string }> {
  const supabase = createClient();
  setLoading(true);

  try {
    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    ).replace(/\/$/, '');
    const redirectTo = `${baseUrl}${ROUTES.AUTH.CALLBACK}`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    if (data?.url) {
      window.location.href = data.url;
      return {};
    }

    setLoading(false);
    return { error: 'Could not start Google sign-in' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    setLoading(false);
    return { error: error.message || 'An error occurred during sign in' };
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize auth state (re-check session when persisted user is missing)
      initialize: async () => {
        const { isLoading, isInitialized, user } = get();
        if (isLoading) {
          return;
        }
        if (isInitialized && user) {
          return;
        }

        const supabase = createClient();

        try {
          set({ isLoading: true });

          // Get current session
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('Error getting session:', sessionError);
            set({ isLoading: false, isInitialized: true });
            return;
          }

          if (session?.user) {
            // Use the auth.users data directly
            const user: AuthUser = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.user_metadata?.name || null,
            };

            set({
              user,
              supabaseUser: session.user,
              isLoading: false,
              isInitialized: true,
            });
          } else {
            set({
              user: null,
              supabaseUser: null,
              isLoading: false,
              isInitialized: true,
            });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              // Use auth.users data directly
              const user: AuthUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata?.name || null,
              };

              set({
                user,
                supabaseUser: session.user,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                supabaseUser: null,
              });
            }
          });
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },

      // Sign in
      signIn: async (email: string, password: string) => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Use auth.users data directly
            const user: AuthUser = {
              id: data.user.id,
              email: data.user.email!,
              name: data.user.user_metadata?.name || null,
            };

            set({
              user,
              supabaseUser: data.user,
              isLoading: false,
            });
          }

          return {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          set({ isLoading: false });
          return { error: error.message || 'An error occurred during sign in' };
        }
      },

      // Sign up
      signUp: async (email: string, password: string) => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
          const baseUrl = (
            process.env.NEXT_PUBLIC_SITE_URL ||
            (typeof window !== 'undefined' ? window.location.origin : '')
          ).replace(/\/$/, '');
          const emailRedirectTo = `${baseUrl}${ROUTES.AUTH.CALLBACK}?next=${encodeURIComponent(
            ROUTES.AUTH.EMAIL_CONFIRMED
          )}`;

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo,
            },
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          const session = data.session;
          const signedUpUser = data.user;

          if (signedUpUser && !session) {
            // Do NOT call signOut() here. PKCE stores a code_verifier cookie during
            // signUp; signOut clears it, so the email confirmation link (exchangeCodeForSession)
            // fails with "code verifier should be non-empty". There is no session yet anyway.
            set({ isLoading: false });
            return {
              needsEmailVerification: true,
              email: signedUpUser.email ?? email,
            };
          }

          if (signedUpUser && session) {
            const profileResult = await ProfileService.createProfile(
              signedUpUser.id,
              null
            );

            if (!profileResult.success) {
              console.error(
                'Profile creation failed - aborting signup:',
                profileResult.error
              );

              await supabase.auth.signOut();

              set({ isLoading: false });
              return {
                error: `Signup failed: Could not create profile. ${profileResult.error}`,
              };
            }

            const user: AuthUser = {
              id: signedUpUser.id,
              email: signedUpUser.email!,
              name: null,
            };

            set({
              user,
              supabaseUser: signedUpUser,
              isLoading: false,
            });
            return {};
          }

          set({ isLoading: false });
          return { error: 'Something went wrong. Please try again.' };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          set({ isLoading: false });
          return { error: error.message || 'An error occurred during sign up' };
        }
      },

      signInWithGoogle: async () =>
        startGoogleOAuthSignIn(loading => set({ isLoading: loading })),

      // Request password reset email (must use prod URL in prod so email link goes to app, not localhost)
      requestPasswordReset: async (email: string) => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
          const origin =
            typeof window !== 'undefined' ? window.location.origin : '';
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
          const baseUrl =
            siteUrl && !siteUrl.includes('localhost')
              ? siteUrl.replace(/\/$/, '')
              : origin && !origin.includes('localhost')
                ? origin
                : origin || siteUrl;
          const redirectTo = `${baseUrl.replace(/\/$/, '')}${ROUTES.AUTH.CALLBACK}?next=${encodeURIComponent(ROUTES.AUTH.RESET_PASSWORD)}`;

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
          });

          set({ isLoading: false });
          if (error) return { error: error.message };
          return {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          set({ isLoading: false });
          return { error: error.message || 'Failed to send reset email' };
        }
      },

      // Sign out
      signOut: async () => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.error('Error signing out:', error);
            throw error;
          }

          // Clear all auth state
          set({
            user: null,
            supabaseUser: null,
            isLoading: false,
            isInitialized: true,
          });

          // Clear persisted storage
          localStorage.removeItem('auth-store');

          return { success: true };
        } catch (error) {
          console.error('Error during sign out:', error);
          set({ isLoading: false });
          return {
            error: error instanceof Error ? error.message : 'Logout failed',
          };
        }
      },

      // Update user (for basic profile updates like name)
      updateUser: async (updates: Partial<AuthUser>) => {
        const { user } = get();
        if (!user) return;

        try {
          const updatedUser = {
            ...user,
            ...updates,
          };

          set({ user: updatedUser });
        } catch (error) {
          console.error('Error updating user:', error);
        }
      },

      // Setters
      setUser: user => set({ user }),
      setSupabaseUser: supabaseUser => set({ supabaseUser }),
      setLoading: isLoading => set({ isLoading }),
      setInitialized: isInitialized => set({ isInitialized }),

      // Reset auth state
      resetAuth: () => set(initialState),
    }),
    {
      name: 'auth-store',
      partialize: state => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
