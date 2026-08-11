'use client';

import { Button, IconButton, Input, Modal, toast } from '@/components/shared';
import { API_ROUTES, type PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

interface ManageMembershipModalProps {
  isOpen: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Public profile slug — scopes the membership lookup. */
  businessSlug?: string;
  onClose: () => void;
}

function useIsDesktopModal() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

/**
 * Public “manage my plan” — email a signed manage/cancel link when a match exists.
 */
export const ManageMembershipModal: React.FC<ManageMembershipModalProps> = ({
  isOpen,
  bookingFlowLocale = 'en',
  businessSlug,
  onClose,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const isDesktop = useIsDesktopModal();
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setIsSending(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error(ui.subscriptions.manageEmailRequired);
      return;
    }

    const slug = businessSlug?.trim();
    if (!slug) {
      toast.error(ui.subscriptions.manageSendFailed);
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(API_ROUTES.PUBLIC_MEMBERSHIPS_MANAGE_LINK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessSlug: slug, email: trimmed }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: string;
      } | null;

      if (res.status === 429) {
        toast.error(json?.error ?? ui.subscriptions.manageRateLimited);
        return;
      }

      if (!res.ok || !json?.success) {
        toast.error(json?.error ?? ui.subscriptions.manageSendFailed);
        return;
      }

      toast.success(json.message ?? ui.subscriptions.manageSendSuccess);
      onClose();
    } catch {
      toast.error(ui.subscriptions.manageSendFailed);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="sm"
      presentation={isDesktop ? 'default' : 'sheet'}
      panelClassName={!isDesktop ? '!max-h-[92dvh]' : ''}
      uniformHorizontalPadding16
      preventClose={isSending}
      contentClassName={
        isDesktop
          ? '!pt-5 sm:!pt-6 !pb-6'
          : '!pt-4 !pb-[max(1.25rem,env(safe-area-inset-bottom))]'
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-lg font-semibold text-white">
              {ui.subscriptions.manageModalTitle}
            </h2>
            <IconButton
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-lg text-zinc-400 hover:text-white"
              icon={<XMarkIcon className="h-5 w-5" aria-hidden />}
              aria-label={ui.subscriptions.closeDetailsAriaLabel}
              disabled={isSending}
              onClick={onClose}
            />
          </div>
          <div className="mt-3 h-px w-full bg-white/[0.08]" aria-hidden />
        </div>

        <p className="m-0 text-sm leading-relaxed text-zinc-400">
          {ui.subscriptions.manageModalDescription}
        </p>

        <Input
          id="manage-membership-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          label={ui.subscriptions.manageEmailLabel}
          placeholder={ui.subscriptions.manageEmailPlaceholder}
          value={email}
          onChange={setEmail}
          disabled={isSending}
          required
        />

        <Button
          type="button"
          variant="inverse"
          fullWidth
          loading={isSending}
          disabled={isSending}
          onClick={() => void handleSubmit()}
        >
          {ui.subscriptions.manageSendLinkCta}
        </Button>
      </div>
    </Modal>
  );
};
