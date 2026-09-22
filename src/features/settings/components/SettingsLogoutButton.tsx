'use client';

import { GlassCard } from '@/components/shared';
import { useSignOutAndRedirect } from '@/features/auth';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const SettingsLogoutButton: React.FC = () => {
  const { signOutAndRedirect, loading } = useSignOutAndRedirect();

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full min-w-0"
    >
      <button
        type="button"
        onClick={() => void signOutAndRedirect()}
        disabled={loading}
        className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowRightStartOnRectangleIcon className="h-5 w-5" aria-hidden />
        {loading ? 'Logging out…' : 'Log out'}
      </button>
    </GlassCard>
  );
};
