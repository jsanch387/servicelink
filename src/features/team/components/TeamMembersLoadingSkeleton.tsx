import { GlassCard } from '@/components/shared';
import React from 'react';

function TeamMemberRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-3.5 py-3.5 sm:px-4">
      <div className="h-9 w-9 shrink-0 rounded-full bg-white/[0.08]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3.5 w-[68%] max-w-[14rem] rounded bg-white/[0.08]" />
        <div className="h-2.5 w-12 rounded bg-white/[0.06]" />
      </div>
      <div className="h-8 w-8 shrink-0 rounded-md bg-white/[0.06]" />
    </li>
  );
}

export const TeamMembersLoadingSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" aria-label="Loading team members">
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      className="!h-auto w-full min-w-0"
    >
      <ul className="animate-pulse divide-y divide-white/10">
        <TeamMemberRowSkeleton />
        <TeamMemberRowSkeleton />
        <TeamMemberRowSkeleton />
      </ul>
    </GlassCard>
  </div>
);
