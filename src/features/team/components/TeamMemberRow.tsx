import { IconButton } from '@/components/shared';
import { TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';

interface TeamMemberRowProps {
  member: TeamMemberUi;
  onRemove: (member: TeamMemberUi) => void;
}

function emailInitial(email: string): string {
  const letter = email.trim().charAt(0);
  return letter ? letter.toUpperCase() : '?';
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({
  member,
  onRemove,
}) => (
  <li className="flex items-center gap-3 px-3.5 py-3.5 sm:px-4">
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-zinc-300"
    >
      {emailInitial(member.email)}
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-zinc-100">
        {member.email}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">
        {member.status === 'invited' ? 'Invited' : 'Active'}
      </p>
    </div>
    <IconButton
      icon={<TrashIcon />}
      variant="ghost"
      size="sm"
      onClick={() => onRemove(member)}
      aria-label={`Remove ${member.email}`}
      title="Remove"
      className="shrink-0 text-zinc-500 hover:text-red-300"
    />
  </li>
);
