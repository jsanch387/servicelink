import { GlassCard } from '@/components/shared';
import React from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { TeamMemberRow } from './TeamMemberRow';

interface TeamMemberListProps {
  members: readonly TeamMemberUi[];
  onSelect: (member: TeamMemberUi) => void;
}

export const TeamMemberList: React.FC<TeamMemberListProps> = ({
  members,
  onSelect,
}) => (
  <GlassCard
    padding="none"
    rounded="rounded-2xl"
    className="!h-auto w-full min-w-0"
  >
    <ul className="divide-y divide-white/10">
      {members.map(member => (
        <TeamMemberRow key={member.id} member={member} onSelect={onSelect} />
      ))}
    </ul>
  </GlassCard>
);
