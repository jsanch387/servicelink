'use client';

import {
  Button,
  PublicFlowBackChevron,
  publicFlowBackNavClassName,
  publicFlowStickyBackHeaderClassName,
  toast,
} from '@/components/shared';
import {
  API_ROUTES,
  getPublicBusinessProfilePath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import { DateSelector } from '@/features/availability/booking/components/DateSelector';
import { TimeSlotGrid } from '@/features/availability/booking/components/TimeSlotGrid';
import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
} from '../types/customerSubscriptionPlan';
import {
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';

interface PublicMembershipSubscribePageProps {
  businessSlug: string;
  plan: CustomerSubscriptionPlan;
  cadenceOption: SubscriptionCadenceOption;
  bookingFlowLocale?: PublicBookingFlowLocale;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  minimumNotice: string;
  /** When false, calendar still works but slots may be empty. */
  schedulingReady: boolean;
  visitDurationMinutes?: number;
}

type SubscribeStep = 'howItWorks' | 'firstVisit';

const HOW_IT_WORKS_ICONS = [
  CheckBadgeIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
] as const;

/** Browser / larger viewports — slightly roomier calendar + slots. */
function useIsLargeScreen() {
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLarge(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isLarge;
}

/**
 * Public subscribe: how it works → date + time → Checkout.
 */
export const PublicMembershipSubscribePage: React.FC<
  PublicMembershipSubscribePageProps
> = ({
  businessSlug,
  plan,
  cadenceOption,
  bookingFlowLocale = 'en',
  weeklySchedule,
  timeOffBlocks,
  minimumNotice,
  schedulingReady,
  visitDurationMinutes = MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const isLargeScreen = useIsLargeScreen();
  const [step, setStep] = useState<SubscribeStep>('howItWorks');
  const [isContinuing, setIsContinuing] = useState(false);
  const [firstVisitDate, setFirstVisitDate] = useState<Date | null>(null);
  const [firstVisitTime, setFirstVisitTime] = useState<string | null>(null);

  const { blockedSlots } = usePublicBlockedSlots(
    step === 'firstVisit' ? businessSlug : undefined
  );

  useEffect(() => {
    setFirstVisitTime(null);
  }, [firstVisitDate]);

  const price = formatSubscriptionPriceCents(
    cadenceOption.priceCents,
    bookingFlowLocale
  );
  const priceSuffix = formatCadencePriceSuffix(
    cadenceOption,
    bookingFlowLocale
  );

  const profileSubscriptionsHref = (() => {
    const base = getPublicBusinessProfilePath(businessSlug, {
      lang: bookingFlowLocale,
    });
    const join = base.includes('?') ? '&' : '?';
    return `${base}${join}tab=subscriptions`;
  })();

  const handleCheckout = async () => {
    if (!firstVisitDate) {
      toast.warning(ui.subscriptions.firstVisitRequired);
      return;
    }
    if (!firstVisitTime?.trim()) {
      toast.warning(ui.subscriptions.firstVisitTimeRequired);
      return;
    }

    setIsContinuing(true);
    try {
      const firstVisitYmd = [
        firstVisitDate.getFullYear(),
        String(firstVisitDate.getMonth() + 1).padStart(2, '0'),
        String(firstVisitDate.getDate()).padStart(2, '0'),
      ].join('-');

      const res = await fetch(API_ROUTES.PUBLIC_MEMBERSHIPS_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          planId: plan.id,
          priceId: cadenceOption.id,
          firstVisitDate: firstVisitYmd,
          firstVisitTime: firstVisitTime.trim().slice(0, 5),
          visitDurationMinutes,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        url?: string;
        error?: string;
      } | null;

      if (!res.ok || !json?.success || !json.url) {
        toast.error(json?.error ?? ui.subscriptions.checkoutStartFailed);
        return;
      }

      window.location.assign(json.url);
    } catch {
      toast.error(ui.subscriptions.checkoutStartFailed);
    } finally {
      setIsContinuing(false);
    }
  };

  const canPay = Boolean(firstVisitDate && firstVisitTime);

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className={publicFlowStickyBackHeaderClassName}>
        <div className="mx-auto flex min-h-[52px] w-full max-w-md items-center px-4 sm:max-w-lg sm:px-6 lg:max-w-xl">
          {step === 'howItWorks' ? (
            <Link
              href={profileSubscriptionsHref}
              className={publicFlowBackNavClassName}
            >
              <PublicFlowBackChevron />
              <span>{ui.subscriptions.subscribePageBackLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              className={publicFlowBackNavClassName}
              onClick={() => setStep('howItWorks')}
            >
              <PublicFlowBackChevron />
              <span>{ui.subscriptions.subscribeStepBackLabel}</span>
            </button>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:max-w-lg sm:px-6 sm:pt-8 lg:max-w-xl">
        <div
          className="mb-6 flex items-center gap-2"
          aria-label={`${step === 'howItWorks' ? '1' : '2'} of 2`}
        >
          <span
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step === 'howItWorks' ? 'bg-white' : 'bg-white/25'
            }`}
          />
          <span
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step === 'firstVisit' ? 'bg-white' : 'bg-white/25'
            }`}
          />
        </div>

        {step === 'howItWorks' ? (
          <section aria-labelledby="subscribe-how-heading">
            <h1
              id="subscribe-how-heading"
              className="text-2xl font-black tracking-tight text-white sm:text-[1.75rem]"
            >
              {ui.subscriptions.howItWorksTitle}
            </h1>

            <ol className="relative mt-8">
              {/* Timeline rail — centered on the icon column */}
              <div
                aria-hidden
                className="absolute top-5 bottom-5 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-white/25 via-white/12 to-white/5"
              />
              {ui.subscriptions.howItWorksSteps.map((item, index) => {
                const Icon = HOW_IT_WORKS_ICONS[index] ?? CheckBadgeIcon;
                const isLast =
                  index === ui.subscriptions.howItWorksSteps.length - 1;
                return (
                  <li
                    key={item.title}
                    className={`relative flex gap-4 ${isLast ? '' : 'pb-8'}`}
                  >
                    <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-[var(--dashboard-bg)] text-zinc-200 shadow-[0_0_0_4px_var(--dashboard-bg)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 pt-1.5">
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
          <section aria-labelledby="subscribe-visit-heading">
            <h1
              id="subscribe-visit-heading"
              className="text-2xl font-black tracking-tight text-white sm:text-[1.75rem]"
            >
              {ui.subscriptions.firstVisitTitle}
            </h1>
            {ui.subscriptions.firstVisitHint ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {ui.subscriptions.firstVisitHint}
              </p>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 lg:p-5">
              <DateSelector
                weeklySchedule={weeklySchedule}
                serviceDurationMinutes={visitDurationMinutes}
                existingBookings={blockedSlots}
                timeOffBlocks={timeOffBlocks}
                minimumNotice={minimumNotice}
                selectedDate={firstVisitDate}
                onSelectDate={setFirstVisitDate}
                plainCalendar
                compactCalendar={!isLargeScreen}
                bookingFlowLocale={bookingFlowLocale}
                requireAvailableSlots={schedulingReady}
              />
            </div>

            <div className="mt-6 lg:mt-8">
              <TimeSlotGrid
                selectedDate={firstVisitDate}
                serviceDurationMinutes={visitDurationMinutes}
                weeklySchedule={weeklySchedule}
                existingBookings={blockedSlots}
                timeOffBlocks={timeOffBlocks}
                minimumNotice={minimumNotice}
                selectedTime={firstVisitTime}
                onSelectTime={setFirstVisitTime}
                compact={!isLargeScreen}
                heading={ui.subscriptions.firstVisitTimeTitle}
                noSlotsHint={ui.subscriptions.firstVisitNoSlots}
                autoSelectFirstAvailable={false}
              />
            </div>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:py-4">
        <div className="mx-auto w-full max-w-md sm:max-w-lg lg:max-w-xl">
          {step === 'howItWorks' ? (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              size={isLargeScreen ? 'lg' : 'sm'}
              onClick={() => setStep('firstVisit')}
            >
              {ui.subscriptions.howItWorksContinueCta}
            </Button>
          ) : (
            <>
              <p className="mb-2 text-center text-xs tabular-nums text-zinc-500 lg:mb-2.5 lg:text-sm">
                <span className="text-zinc-400">{plan.name}</span>
                <span className="mx-1.5 text-zinc-600" aria-hidden>
                  ·
                </span>
                <span className="text-zinc-300">
                  {price}
                  {priceSuffix}
                </span>
              </p>
              <Button
                type="button"
                variant="inverse"
                fullWidth
                size={isLargeScreen ? 'lg' : 'sm'}
                loading={isContinuing}
                disabled={isContinuing || !canPay}
                onClick={() => void handleCheckout()}
              >
                {ui.subscriptions.continueToCheckoutCta}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
