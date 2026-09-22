'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useSignOutAndRedirect } from '@/features/auth';
import Link from 'next/link';
import React from 'react';

interface RemovedFromTeamScreenProps {
  businessName: string;
}

export const RemovedFromTeamScreen: React.FC<RemovedFromTeamScreenProps> = ({
  businessName,
}) => {
  const { signOutAndRedirect, loading } = useSignOutAndRedirect();
  const shop = businessName.trim() || 'this shop';

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[var(--dashboard-bg)] px-4 py-8">
      <div className="w-full min-w-0 max-w-md text-center">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          You&apos;re no longer on this team
        </h1>
        <GlassCard
          padding="none"
          rounded="rounded-2xl"
          className="!h-auto mt-6 w-full min-w-0 p-4 text-center"
        >
          <p className="text-sm leading-relaxed text-zinc-300">
            {shop} removed your access. You can&apos;t open their bookings
            anymore. Ask the owner if you need a new invite.
          </p>
        </GlassCard>
        <Button
          type="button"
          variant="inverse"
          fullWidth
          className="mt-6 font-semibold"
          loading={loading}
          disabled={loading}
          onClick={() => void signOutAndRedirect()}
        >
          Log out
        </Button>
        <Link
          href={ROUTES.DASHBOARD.CREATE_OWN_SHOP}
          className="mt-4 inline-flex cursor-pointer text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
        >
          Create your own business
        </Link>
      </div>
    </main>
  );
};
