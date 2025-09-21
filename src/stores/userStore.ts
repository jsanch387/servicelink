import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  hasCompletedOnboarding: boolean;
  profileId?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface UserActions {
  // Auth actions
  login: (_email: string, _password: string) => Promise<void>;
  signup: (_email: string, _password: string, _name: string) => Promise<void>;
  logout: () => void;

  // Onboarding actions
  completeOnboarding: (_profileId: string) => void;

  // Utility
  setUser: (_user: User) => void;
}

const mockUsers = [
  {
    id: 'user-1',
    email: 'demo@example.com',
    name: 'Demo User',
    hasCompletedOnboarding: false,
  },
];

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        // Mock API call
        console.log('🔐 Mock API: Login attempt', { email, password });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock authentication - for demo, any email/password works
        const mockUser = mockUsers.find(u => u.email === email) || {
          id: 'user-' + Date.now(),
          email,
          name: email.split('@')[0],
          hasCompletedOnboarding: false,
        };

        console.log('✅ Mock API: Login successful', mockUser);

        set({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      signup: async (email: string, password: string, name: string) => {
        set({ isLoading: true });

        // Mock API call
        console.log('📝 Mock API: Signup attempt', { email, password, name });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1200));

        const newUser = {
          id: 'user-' + Date.now(),
          email,
          name,
          hasCompletedOnboarding: false,
        };

        console.log('✅ Mock API: Signup successful', newUser);

        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        console.log('👋 Mock API: User logged out');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      completeOnboarding: (profileId: string) => {
        const { user } = get();
        if (user) {
          const updatedUser = {
            ...user,
            hasCompletedOnboarding: true,
            profileId,
          };

          console.log('🎉 Mock API: Onboarding completed', {
            userId: user.id,
            profileId,
          });

          set({ user: updatedUser });
        }
      },

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
        });
      },
    }),
    {
      name: 'user-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
