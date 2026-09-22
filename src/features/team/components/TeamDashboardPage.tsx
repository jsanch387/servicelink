'use client';

import { Button } from '@/components/shared';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { TeamMembersPanel } from './TeamMembersPanel';

export const TeamDashboardPage: React.FC = () => (
  <main className="min-h-screen w-full flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <TeamMembersPanel
        toolbar={openInvite => (
          <header className="mb-7 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Team
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Invite people who work this shop.
              </p>
            </div>
            <Button
              type="button"
              variant="inverse"
              size="sm"
              className="shrink-0 font-semibold"
              icon={<PlusIcon className="h-4 w-4" aria-hidden />}
              onClick={openInvite}
              aria-label="Invite team member"
            >
              Invite
            </Button>
          </header>
        )}
      />
    </div>
  </main>
);
