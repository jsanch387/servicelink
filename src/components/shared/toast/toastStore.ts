'use client';

import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss after ms; 0 = stay until dismissed. */
  durationMs: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'> & { id?: string }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const MAX_TOASTS = 3;

function createToastId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: toast => {
    const id = toast.id ?? createToastId();
    const next: ToastItem = {
      id,
      type: toast.type,
      message: toast.message,
      durationMs: toast.durationMs,
    };
    const existing = get().toasts.filter(t => t.id !== id);
    set({ toasts: [...existing, next].slice(-MAX_TOASTS) });
    return id;
  },
  dismiss: id => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },
  clear: () => set({ toasts: [] }),
}));
