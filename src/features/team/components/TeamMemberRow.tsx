'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { teamMemberHeading } from '../utils/teamInviteDisplayName';

interface TeamMemberRowProps {
  member: TeamMemberUi;
  onSelect: (member: TeamMemberUi) => void;
}

function headingInitial(label: string): string {
  const letter = label.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({
  member,
  onSelect,
}) => {
  const heading = teamMemberHeading(member);

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(member)}
        className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-3.5 text-left sm:px-4"
        aria-label={`Open ${heading}`}
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300"
        >
          {headingInitial(heading)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">
            {heading}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {member.email}
          </p>
        </div>
        <ChevronRightIcon
          className="h-4 w-4 shrink-0 text-zinc-600"
          aria-hidden
        />
      </button>
    </li>
  );
};
