import { create } from 'zustand';
import type { Notification } from '@/entities/types';

interface UiState {
  notifications: Notification[];
  loading: boolean;
  showNotification: (message: string, type: Notification['type']) => void;
  hideNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  notifications: [],
  loading: false,
  showNotification: (message, type) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  hideNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  setLoading: (loading) => set({ loading }),
}));

