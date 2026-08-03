'use client';

import { useToastStore, type ToastType } from './toastStore';

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  error: 5000,
  success: 3500,
  warning: 4500,
};

export interface ToastOptions {
  /** Override auto-dismiss duration. Pass `0` to keep until dismissed. */
  durationMs?: number;
}

function show(
  type: ToastType,
  message: string,
  options?: ToastOptions
): string {
  const trimmed = message.trim();
  if (!trimmed) return '';
  return useToastStore.getState().push({
    type,
    message: trimmed,
    durationMs: options?.durationMs ?? DEFAULT_DURATION_MS[type],
  });
}

/**
 * App-wide toast API. Mount `<ToastViewport />` once (e.g. root layout).
 *
 * @example
 * toast.error('Failed to save')
 * toast.success('Saved')
 * toast.warning('Almost out of slots')
 */
export const toast = {
  error: (message: string, options?: ToastOptions) =>
    show('error', message, options),
  success: (message: string, options?: ToastOptions) =>
    show('success', message, options),
  warning: (message: string, options?: ToastOptions) =>
    show('warning', message, options),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  clear: () => useToastStore.getState().clear(),
};
