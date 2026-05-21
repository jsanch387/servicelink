'use client';

import { GoogleIcon } from '@/components/shared';
import React from 'react';

const googleBtnClass =
  'cursor-pointer flex w-full min-h-[52px] sm:min-h-[56px] items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-white/[0.04] px-3 sm:px-5 text-sm sm:text-base font-semibold text-white transition-all duration-200 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

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
      <GoogleIcon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
      {googleLoading ? 'Redirecting…' : 'Google'}
    </button>
  );
}
