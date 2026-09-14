'use client';

import { toast } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import React, { useCallback, useEffect, useState } from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';
import { RemoveTeamMemberModal } from './RemoveTeamMemberModal';
import { TeamDashboardEmptyState } from './TeamDashboardEmptyState';
import { TeamMemberList } from './TeamMemberList';
import { TeamMembersLoadingSkeleton } from './TeamMembersLoadingSkeleton';

interface TeamMembersPanelProps {
  toolbar?: (openInvite: () => void) => React.ReactNode;
}

export const TeamMembersPanel: React.FC<TeamMembersPanelProps> = ({
  toolbar,
}) => {
  const [members, setMembers] = useState<TeamMemberUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberUi | null>(
    null
  );

  const loadMembers = useCallback(async () => {
    const response = await fetch(API_ROUTES.TEAM_MEMBERS);
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      members?: TeamMemberUi[];
    } | null;
    if (!response.ok || !result?.success || !result.members) {
      throw new Error('Could not load team');
    }
    setMembers(result.members);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadMembers()
      .catch(() => {
        if (!cancelled) toast.error('Could not load team');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadMembers]);

  const handleInvite = async (email: string) => {
    const response = await fetch(API_ROUTES.TEAM_INVITES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
      member?: TeamMemberUi;
    } | null;
    if (!response.ok || !result?.success || !result.member) {
      return {
        ok: false as const,
        error: result?.error || 'Could not send invite',
      };
    }

    setMembers(current => {
      const withoutDuplicate = current.filter(
        member => member.email !== result.member!.email
      );
      return [...withoutDuplicate, result.member!];
    });
    toast.success('Invite sent');
    return { ok: true as const };
  };

  const handleRemove = async (member: TeamMemberUi) => {
    const response = await fetch(API_ROUTES.TEAM_REMOVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, source: member.source }),
    });
    const result = (await response.json().catch(() => null)) as {
      success?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !result?.success) {
      toast.error(result?.error || 'Could not remove');
      return;
    }
    setMembers(current => current.filter(row => row.id !== member.id));
    setMemberToRemove(null);
    toast.success('Removed');
  };

  return (
    <div>
      {toolbar?.(() => setInviteOpen(true))}
      {loading ? (
        <TeamMembersLoadingSkeleton />
      ) : members.length === 0 ? (
        <TeamDashboardEmptyState onAddMember={() => setInviteOpen(true)} />
      ) : (
        <TeamMemberList members={members} onRemove={setMemberToRemove} />
      )}
      <InviteTeamMemberModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
      <RemoveTeamMemberModal
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemove}
      />
    </div>
  );
};
