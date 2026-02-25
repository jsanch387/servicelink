'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export const useAuth = () => {
  const store = useAuthStore();

  // Initialize auth on first use
  useEffect(() => {
    if (!store.isInitialized) {
      store.initialize();
    }
  }, [store]);

  return {
    // State
    user: store.user,
    supabaseUser: store.supabaseUser,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    isAuthenticated: !!store.user,

    // Actions
    signIn: store.signIn,
    signUp: store.signUp,
    signInWithGoogle: store.signInWithGoogle,
    signOut: store.signOut,
    updateUser: store.updateUser,

    // Utilities
    resetAuth: store.resetAuth,
  };
};
