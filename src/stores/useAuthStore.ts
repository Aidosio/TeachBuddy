import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/entities/types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAuthenticated: () => !!get().user && !!get().token,
    }),
    {
      name: 'auth-storage',
    }
  )
);

