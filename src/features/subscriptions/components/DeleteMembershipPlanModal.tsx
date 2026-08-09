'use client';

import { Button, Modal } from '@/components/shared';
import React from 'react';

interface DeleteMembershipPlanModalProps {
  isOpen: boolean;
  planName: string;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteMembershipPlanModal: React.FC<
  DeleteMembershipPlanModalProps
> = ({ isOpen, planName, isDeleting, error, onConfirm, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete plan"
      maxWidth="sm"
      preventClose={isDeleting}
      uniformHorizontalPadding16
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-200">
          Delete <span className="font-semibold text-white">{planName}</span>{' '}
          from your booking link?
        </p>
        <p className="text-sm text-zinc-500">
          New customers won&apos;t see it. This can&apos;t be undone from the
          dashboard.
        </p>

        {error ? (
          <div className="rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            className="sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={isDeleting}
            loading={isDeleting}
            className="sm:order-2"
          >
            Delete plan
          </Button>
        </div>
      </div>
    </Modal>
  );
};
