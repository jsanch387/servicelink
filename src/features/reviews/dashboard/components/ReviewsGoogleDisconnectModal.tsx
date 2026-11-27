'use client';

import { Button, Modal } from '@/components/shared';
import React, { useEffect, useState } from 'react';
import {
  GOOGLE_CONNECT_DISCONNECT_CANCEL,
  GOOGLE_CONNECT_DISCONNECT_CONFIRM,
  GOOGLE_CONNECT_DISCONNECT_MODAL_BODY,
  GOOGLE_CONNECT_DISCONNECT_MODAL_TITLE,
} from '../copy/googleConnectCopy';

type ReviewsGoogleDisconnectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export const ReviewsGoogleDisconnectModal: React.FC<
  ReviewsGoogleDisconnectModalProps
> = ({ isOpen, onClose, onConfirm }) => {
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!isOpen) setDisconnecting(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    try {
      await onConfirm();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={GOOGLE_CONNECT_DISCONNECT_MODAL_TITLE}
      maxWidth="sm"
      uniformHorizontalPadding16
      preventClose={disconnecting}
      presentation="center"
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-zinc-400">
          {GOOGLE_CONNECT_DISCONNECT_MODAL_BODY}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={disconnecting}
            className="cursor-pointer"
            onClick={onClose}
          >
            {GOOGLE_CONNECT_DISCONNECT_CANCEL}
          </Button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            loading={disconnecting}
            disabled={disconnecting}
            className="cursor-pointer"
            onClick={() => void handleConfirm()}
            aria-label={
              disconnecting ? 'Disconnecting Google' : GOOGLE_CONNECT_DISCONNECT_CONFIRM
            }
          >
            {GOOGLE_CONNECT_DISCONNECT_CONFIRM}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
