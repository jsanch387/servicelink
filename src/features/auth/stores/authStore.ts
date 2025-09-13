'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/libs/supabase';
import { ProfileService } from '@/features/profiles';
import type {
  AuthStore,
  AuthUser,
  SignInCredentials,
  SignUpCredentials,
} from '../types/auth';

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
      signUp: async (email: string, password: string, name?: string) => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || '',
              },
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
              name || null
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
              name: name || null,
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
