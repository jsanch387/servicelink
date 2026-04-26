'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const supabaseUser = useAuthStore(state => state.supabaseUser);
  const isLoading = useAuthStore(state => state.isLoading);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const initialize = useAuthStore(state => state.initialize);
  const signIn = useAuthStore(state => state.signIn);
  const signUp = useAuthStore(state => state.signUp);
  const signInWithGoogle = useAuthStore(state => state.signInWithGoogle);
  const requestPasswordReset = useAuthStore(state => state.requestPasswordReset);
  const signOut = useAuthStore(state => state.signOut);
  const updateUser = useAuthStore(state => state.updateUser);
  const resetAuth = useAuthStore(state => state.resetAuth);

  // Initialize auth on first use
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    // State
    user,
    supabaseUser,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,

    // Actions
    signIn,
    signUp,
    signInWithGoogle,
    requestPasswordReset,
    signOut,
    updateUser,

    // Utilities
    resetAuth,
  };
};
