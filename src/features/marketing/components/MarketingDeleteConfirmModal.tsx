'use client';

import { Button, Modal } from '@/components/shared';
import React from 'react';

interface MarketingDeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  error?: string | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const MarketingDeleteConfirmModal: React.FC<
  MarketingDeleteConfirmModalProps
> = ({
  isOpen,
  title,
  description,
  error,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="sm">
      <p className="mb-6 text-sm text-gray-300">{description}</p>
      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          variant="danger"
          loading={isDeleting}
          disabled={isDeleting}
          className="w-full sm:flex-1"
        >
          {isDeleting ? 'Deleting' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
};
