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
  signIn: (_email: string, _password: string) => Promise<{ error?: string }>;
  signUp: (_email: string, _password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  requestPasswordReset: (_email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ success?: boolean; error?: string }>;

  // User management
  setUser: (_user: AuthUser | null) => void;
  setSupabaseUser: (_user: User | null) => void;
  updateUser: (_updates: Partial<AuthUser>) => Promise<void>;

  // State management
  setLoading: (_loading: boolean) => void;
  setInitialized: (_initialized: boolean) => void;
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
}

export interface AuthError {
  message: string;
  code?: string;
}
