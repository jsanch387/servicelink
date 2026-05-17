'use client';

import { GoogleIcon } from '@/components/shared';
import React from 'react';

const googleBtnClass =
  'flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50';

type AuthGoogleButtonProps = {
  onGoogle: () => void;
  googleLoading?: boolean;
  disabled?: boolean;
};

export function AuthGoogleButton({
  onGoogle,
  googleLoading = false,
  disabled = false,
}: AuthGoogleButtonProps) {
  const isDisabled = disabled || googleLoading;

  return (
    <button
      type="button"
      className={googleBtnClass}
      onClick={onGoogle}
      disabled={isDisabled}
      aria-busy={googleLoading}
    >
      <GoogleIcon className="h-5 w-5 shrink-0" />
      {googleLoading ? 'Redirecting…' : 'Google'}
    </button>
  );
}
