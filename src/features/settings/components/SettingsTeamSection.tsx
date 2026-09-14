'use client';

import { IconButton } from '@/components/shared';
import { TeamMembersPanel } from '@/features/team';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const SettingsTeamSection: React.FC = () => (
  <section id="team" className="w-full min-w-0">
    <TeamMembersPanel
      toolbar={openInvite => (
        <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
          <h2 className="min-w-0 text-base font-semibold text-white">
            Team members
          </h2>
          <IconButton
            icon={<PlusIcon />}
            variant="ghost"
            size="md"
            onClick={openInvite}
            aria-label="Invite team member"
            title="Invite"
            className="shrink-0"
          />
        </div>
      )}
    />
  </section>
);
