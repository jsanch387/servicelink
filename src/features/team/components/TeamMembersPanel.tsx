'use client';

import { toast } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import React, { useCallback, useEffect, useState } from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';
import { InviteTeamMemberModal } from './InviteTeamMemberModal';
import { RemoveTeamMemberModal } from './RemoveTeamMemberModal';
import { TeamDashboardEmptyState } from './TeamDashboardEmptyState';
import { TeamMemberDetailPanel } from './TeamMemberDetailPanel';
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
  const [loadError, setLoadError] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberUi | null>(
    null
  );
  const [memberToRemove, setMemberToRemove] = useState<TeamMemberUi | null>(
    null
  );
  const [savingName, setSavingName] = useState(false);

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

  const refreshMembers = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      await loadMembers();
    } catch {
      setLoadError(true);
      toast.error('Could not load team');
    } finally {
      setLoading(false);
    }
  }, [loadMembers]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    void loadMembers()
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          toast.error('Could not load team');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadMembers]);

  const handleInvite = async (email: string, name: string) => {
    const response = await fetch(API_ROUTES.TEAM_INVITES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !result?.ok) {
      return {
        ok: false as const,
        error: result?.error || 'Could not send invite',
      };
    }

    try {
      await loadMembers();
    } catch {
      /* invite already sent */
    }
    toast.success('Invite sent');
    return { ok: true as const };
  };

  const handleSaveName = async (member: TeamMemberUi, name: string) => {
    setSavingName(true);
    try {
      const response = await fetch(API_ROUTES.TEAM_MEMBERS, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          source: member.source,
          name,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        name?: string;
        error?: string;
      } | null;
      if (!response.ok || !result?.success || !result.name) {
        return {
          ok: false as const,
          error: result?.error || 'Could not update name',
        };
      }

      const nextName = result.name;
      setMembers(current =>
        current.map(row =>
          row.id === member.id ? { ...row, name: nextName } : row
        )
      );
      setSelectedMember(current =>
        current?.id === member.id ? { ...current, name: nextName } : current
      );
      toast.success('Name updated');
      return { ok: true as const, name: nextName };
    } finally {
      setSavingName(false);
    }
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
    setSelectedMember(null);
    toast.success('Removed');
  };

  return (
    <div>
      {toolbar?.(() => setInviteOpen(true))}
      {loading ? (
        <TeamMembersLoadingSkeleton />
      ) : loadError ? (
        <TeamDashboardEmptyState
          title="Could not load team"
          description="Check your connection and try again."
          actionLabel="Try again"
          showAddIcon={false}
          onAddMember={() => void refreshMembers()}
        />
      ) : members.length === 0 ? (
        <TeamDashboardEmptyState onAddMember={() => setInviteOpen(true)} />
      ) : (
        <TeamMemberList members={members} onSelect={setSelectedMember} />
      )}
      <InviteTeamMemberModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />
      {selectedMember ? (
        <TeamMemberDetailPanel
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onSaveName={handleSaveName}
          onRemove={setMemberToRemove}
          isSaving={savingName}
        />
      ) : null}
      <RemoveTeamMemberModal
        member={memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemove}
      />
    </div>
  );
};
