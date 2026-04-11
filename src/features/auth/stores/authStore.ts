'use client';

import { getSafePostAuthDashboardPath, ROUTES } from '@/constants/routes';
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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Initialize auth state
      initialize: async () => {
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
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: undefined, // Disable email confirmation redirect
            },
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // CRITICAL: Create profile - signup fails if this fails
            const profileResult = await ProfileService.createProfile(
              data.user.id,
              null // No name provided during signup
            );

            if (!profileResult.success) {
              console.error(
                'Profile creation failed - aborting signup:',
                profileResult.error
              );

              // Sign out to clear the auth user
              await supabase.auth.signOut();

              set({ isLoading: false });
              return {
                error: `Signup failed: Could not create profile. ${profileResult.error}`,
              };
            }

            // Success - both auth user and profile created
            const user: AuthUser = {
              id: data.user.id,
              email: data.user.email!,
              name: null, // No name provided during signup
            };

            set({
              user,
              supabaseUser: data.user,
              isLoading: false,
            });
          }

          set({ isLoading: false });
          return {};
        } catch (error: any) {
          set({ isLoading: false });
          return { error: error.message || 'An error occurred during sign up' };
        }
      },

      // Sign in with Google (OAuth redirect)
      signInWithGoogle: async (redirectAfterLogin?: string | null) => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
          // Use explicit site URL in prod so redirect never goes to localhost
          const baseUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            (typeof window !== 'undefined' ? window.location.origin : '');
          const safeNext = getSafePostAuthDashboardPath(
            redirectAfterLogin ?? ROUTES.DASHBOARD.MAIN
          );
          const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data?.url) {
            window.location.href = data.url;
            return {};
          }

          set({ isLoading: false });
          return { error: 'Could not start Google sign-in' };
        } catch (error: any) {
          set({ isLoading: false });
          return { error: error.message || 'An error occurred during sign in' };
        }
      },

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
          const redirectTo = `${baseUrl}/auth/reset-password`;

          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
          });

          set({ isLoading: false });
          if (error) return { error: error.message };
          return {};
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
