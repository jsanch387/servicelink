'use client';

import { Button, IconButton, Modal, toast } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
} from '../types/customerSubscriptionPlan';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import { joinDescriptionAndBenefits } from '../utils/planDescription';

interface SubscribePlanDetailsModalProps {
  isOpen: boolean;
  plan: CustomerSubscriptionPlan | null;
  cadenceOption: SubscriptionCadenceOption | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  onClose: () => void;
  /** Starts Stripe Checkout for the selected cadence. */
  onContinueToCheckout?: (
    planId: string,
    cadenceOptionId: string
  ) => void | Promise<void>;
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
 * After Subscribe: show plan summary + how it works, then continue to checkout.
 */
export const SubscribePlanDetailsModal: React.FC<
  SubscribePlanDetailsModalProps
> = ({
  isOpen,
  plan,
  cadenceOption,
  bookingFlowLocale = 'en',
  onClose,
  onContinueToCheckout,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const isDesktop = useIsDesktopModal();
  const [isContinuing, setIsContinuing] = useState(false);

  if (!plan || !cadenceOption) return null;

  const description = joinDescriptionAndBenefits(
    plan.description,
    plan.benefits
  ).trim();
  const price = formatSubscriptionPriceCents(
    cadenceOption.priceCents,
    bookingFlowLocale
  );
  const priceSuffix = formatCadencePriceSuffix(
    cadenceOption,
    bookingFlowLocale
  );
  const cadenceLabel = formatCadenceOptionLabel(
    cadenceOption,
    bookingFlowLocale
  );

  const handleContinue = async () => {
    if (onContinueToCheckout) {
      setIsContinuing(true);
      try {
        await onContinueToCheckout(plan.id, cadenceOption.id);
      } finally {
        setIsContinuing(false);
      }
      return;
    }
    toast.warning(ui.subscriptions.checkoutComingSoon);
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
      preventClose={isContinuing}
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
              {ui.subscriptions.detailsModalTitle}
            </h2>
            <IconButton
              variant="ghost"
              size="sm"
              className="shrink-0 rounded-lg text-zinc-400 hover:text-white"
              icon={<XMarkIcon className="h-5 w-5" aria-hidden />}
              aria-label={ui.subscriptions.closeDetailsAriaLabel}
              disabled={isContinuing}
              onClick={onClose}
            />
          </div>
          <div className="mt-3 h-px w-full bg-white/[0.08]" aria-hidden />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 pr-1">
              <h3 className="m-0 text-base font-semibold tracking-tight break-words text-white sm:text-lg">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-400">{cadenceLabel}</p>
            </div>
            <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
              <span className="text-2xl font-semibold tracking-tight text-white">
                {price}
              </span>
              {priceSuffix ? (
                <span className="text-sm font-medium text-zinc-500">
                  {priceSuffix}
                </span>
              ) : null}
            </div>
          </div>

          {description ? (
            <p className="mt-4 whitespace-pre-wrap border-t border-white/[0.06] pt-4 text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>

        <div>
          <h4 className="m-0 text-sm font-semibold text-white">
            {ui.subscriptions.howItWorksTitle}
          </h4>
          <ol className="mt-3 space-y-3">
            {ui.subscriptions.howItWorksSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-semibold text-zinc-200">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm leading-snug text-zinc-400">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <Button
          type="button"
          variant="inverse"
          fullWidth
          loading={isContinuing}
          disabled={isContinuing}
          onClick={() => void handleContinue()}
        >
          {ui.subscriptions.continueToCheckoutCta}
        </Button>
      </div>
    </Modal>
  );
};
