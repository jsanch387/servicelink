import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  profileId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  supabaseUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
}

export interface AuthActions {
  // Authentication
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<{ success?: boolean; error?: string }>;

  // User management
  setUser: (user: AuthUser | null) => void;
  setSupabaseUser: (user: User | null) => void;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;

  // Utilities
  resetAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}
