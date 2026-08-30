'use client';

import { Button, Modal } from '@/components/shared';
import { nativeCheckboxSmClassName } from '@/components/shared/nativeCheckboxClasses';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useEffect, useState } from 'react';

export function BookingPolicyAgreeModal({
  isOpen,
  policyText,
  onClose,
  onAgreed,
  bookingFlowLocale = 'en',
}: {
  isOpen: boolean;
  policyText: string;
  onClose: () => void;
  onAgreed: () => void;
  bookingFlowLocale?: PublicBookingFlowLocale;
}) {
  const ui = publicBookingUi(bookingFlowLocale);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (isOpen) setAgreed(false);
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ui.calendar.policyHeading}
      showCloseButton
      closeAriaLabel={ui.common.close}
      maxWidth="lg"
      panelMaxHeightClass="max-h-[90dvh]"
      contentClassName="flex flex-col !overflow-hidden !pt-4 !pb-6 sm:!pt-5 sm:!pb-7"
    >
      <div className="min-h-0 max-h-[min(52dvh,22rem)] overflow-y-auto overscroll-contain rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 sm:max-h-48 sm:px-4 sm:py-3.5">
        <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-zinc-300 sm:text-sm sm:leading-relaxed">
          {policyText}
        </p>
      </div>
      <div className="mt-4 shrink-0 space-y-3 border-t border-white/[0.06] pt-4">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={event => setAgreed(event.target.checked)}
            className={`mt-0.5 cursor-pointer ${nativeCheckboxSmClassName}`}
          />
          <span className="text-sm text-gray-200">
            {ui.calendar.policyConsentCheckboxLabel}
          </span>
        </label>
        <Button
          type="button"
          variant="inverse"
          fullWidth
          className="font-semibold"
          disabled={!agreed}
          onClick={onAgreed}
        >
          {ui.common.continue}
        </Button>
      </div>
    </Modal>
  );
}

export function PublicBookingPolicyAgreeDialog({
  isOpen,
  required,
  policyText,
  onClose,
  onAgreed,
  bookingFlowLocale = 'en',
}: {
  isOpen: boolean;
  required: boolean;
  policyText: string;
  onClose: () => void;
  onAgreed: () => void;
  bookingFlowLocale?: PublicBookingFlowLocale;
}) {
  if (!required) return null;
  return (
    <BookingPolicyAgreeModal
      isOpen={isOpen}
      policyText={policyText}
      onClose={onClose}
      onAgreed={onAgreed}
      bookingFlowLocale={bookingFlowLocale}
    />
  );
}
