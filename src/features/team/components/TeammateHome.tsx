import { GlassCard } from '@/components/shared';
import React from 'react';

interface TeammateHomeProps {
  businessName: string;
}

export const TeammateHome: React.FC<TeammateHomeProps> = ({ businessName }) => (
  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Team
      </h1>
      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        className="!h-auto mt-6 w-full min-w-0 p-4 text-left"
      >
        <p className="text-sm leading-relaxed text-zinc-300">
          You&apos;re on {businessName}&apos;s team. You can log in here
          anytime.
        </p>
      </GlassCard>
    </div>
  </main>
);
