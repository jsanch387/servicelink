'use client';

import { Button, Modal } from '@/components/shared';
import React from 'react';
import type { TeamMemberUi } from '../types/teamMemberUi';

interface RemoveTeamMemberModalProps {
  member: TeamMemberUi | null;
  onClose: () => void;
  onConfirm: (member: TeamMemberUi) => void;
}

export const RemoveTeamMemberModal: React.FC<RemoveTeamMemberModalProps> = ({
  member,
  onClose,
  onConfirm,
}) => (
  <Modal
    isOpen={member != null}
    onClose={onClose}
    title="Remove"
    maxWidth="sm"
    uniformHorizontalPadding16
  >
    {member ? (
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-zinc-400">
          Removing this team member will stop them from accessing your shop.
          They won&apos;t be able to log in anymore.
        </p>
        <p className="truncate text-sm text-zinc-300">{member.email}</p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={() => onConfirm(member)}>
            Remove
          </Button>
        </div>
      </div>
    ) : null}
  </Modal>
);
