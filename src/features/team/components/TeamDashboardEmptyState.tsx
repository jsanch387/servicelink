import { Button, GlassCard } from '@/components/shared';
import { PlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface TeamDashboardEmptyStateProps {
  onAddMember: () => void;
}

export const TeamDashboardEmptyState: React.FC<
  TeamDashboardEmptyStateProps
> = ({ onAddMember }) => (
  <GlassCard
    padding="none"
    rounded="rounded-2xl"
    className="!h-auto w-full min-w-0"
  >
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]">
        <UsersIcon className="h-6 w-6 text-zinc-500" aria-hidden />
      </div>
      <p className="text-sm font-medium text-zinc-300">No team members yet</p>
      <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-zinc-500">
        Invite someone so they can join this shop.
      </p>
      <Button
        type="button"
        variant="inverse"
        size="xs"
        className="mt-4"
        icon={<PlusIcon />}
        onClick={onAddMember}
      >
        Add member
      </Button>
    </div>
  </GlassCard>
);
