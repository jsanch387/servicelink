'use client';

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { useToastStore, type ToastItem, type ToastType } from './toastStore';

const TYPE_STYLES: Record<
  ToastType,
  { panel: string; icon: string; Icon: typeof XCircleIcon }
> = {
  error: {
    panel: 'border-red-500/40 bg-red-950/90 text-red-100',
    icon: 'text-red-400',
    Icon: XCircleIcon,
  },
  success: {
    panel: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
    icon: 'text-emerald-400',
    Icon: CheckCircleIcon,
  },
  warning: {
    panel: 'border-amber-500/40 bg-amber-950/90 text-amber-100',
    icon: 'text-amber-400',
    Icon: ExclamationTriangleIcon,
  },
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore(s => s.dismiss);
  const { panel, icon, Icon } = TYPE_STYLES[toast.type];

  useEffect(() => {
    if (toast.durationMs <= 0) return;
    const timer = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.durationMs, toast.id]);

  return (
    <div
      role="status"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md ${panel}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} aria-hidden />
      <p className="min-w-0 flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Renders active toasts. Mount once near the app root.
 * Dashboard offsets for the sidebar; public pages stay viewport-centered.
 */
export function ToastViewport(): React.ReactElement {
  const toasts = useToastStore(s => s.toasts);
  const pathname = usePathname();
  const inDashboard = Boolean(pathname?.startsWith('/dashboard'));

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-20 z-[100] flex flex-col items-center gap-2 px-4 sm:top-24 sm:px-6 ${
        inDashboard ? 'lg:left-64' : ''
      }`}
      aria-label="Notifications"
    >
      {toasts.map(item => (
        <ToastCard key={item.id} toast={item} />
      ))}
    </div>
  );
}
