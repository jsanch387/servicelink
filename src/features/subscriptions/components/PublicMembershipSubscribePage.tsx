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
import type { ServiceLocationMode } from '@/features/business-profile/utils/location';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
} from '../types/customerSubscriptionPlan';
import {
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
} from '../utils/formatSubscriptionPrice';
import {
  isMembershipContactComplete,
  isMembershipServiceDetailsComplete,
} from '../utils/membershipServiceDetailsComplete';
import {
  EMPTY_MEMBERSHIP_SERVICE_DETAILS,
  MembershipServiceDetailsFields,
  type MembershipServiceDetailsValue,
} from './MembershipServiceDetailsFields';
import { PublicMembershipStepHeading } from './PublicMembershipStepHeading';

interface PublicMembershipSubscribePageProps {
  businessSlug: string;
  plan: CustomerSubscriptionPlan;
  cadenceOption: SubscriptionCadenceOption;
  bookingFlowLocale?: PublicBookingFlowLocale;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  minimumNotice: string;
  schedulingReady: boolean;
  visitDurationMinutes?: number;
  serviceLocationMode?: ServiceLocationMode;
}

type SubscribeStep = 'howItWorks' | 'contact' | 'serviceDetails' | 'firstVisit';

const HOW_IT_WORKS_ICONS = [
  CheckBadgeIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
] as const;

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
 * Public subscribe: how it works → contact → (details if needed) → date → Checkout.
 * Existing CRM customers get address/vehicle silently when complete.
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
  serviceLocationMode = 'mobile_only',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const isLargeScreen = useIsLargeScreen();
  const needsAddress = serviceLocationMode !== 'shop_only';
  const needsVehicle = true;

  const [step, setStep] = useState<SubscribeStep>('howItWorks');
  const [isContinuing, setIsContinuing] = useState(false);
  const [details, setDetails] = useState<MembershipServiceDetailsValue>(
    EMPTY_MEMBERSHIP_SERVICE_DETAILS
  );
  const [usedSavedDetails, setUsedSavedDetails] = useState(false);
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

  const stepIndex = useMemo(() => {
    const order: SubscribeStep[] = [
      'howItWorks',
      'contact',
      'serviceDetails',
      'firstVisit',
    ];
    return order.indexOf(step);
  }, [step]);

  const lookupAndAdvanceFromContact = async () => {
    if (!isMembershipContactComplete(details)) {
      toast.warning(ui.subscriptions.contactIncomplete);
      return;
    }
    setIsContinuing(true);
    try {
      const res = await fetch(API_ROUTES.PUBLIC_MEMBERSHIPS_CUSTOMER_SNAPSHOT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessSlug,
          phone: details.phone,
          email: details.email,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        matched?: boolean;
        hasUsableAddress?: boolean;
        hasVehicle?: boolean;
        address?: {
          street?: string;
          unit?: string;
          city?: string;
          state?: string;
          zip?: string;
        } | null;
        vehicle?: { year?: string; make?: string; model?: string } | null;
      } | null;

      let next = { ...details };
      let saved = false;
      if (json?.success && json.matched) {
        if (json.address) {
          next = {
            ...next,
            street: json.address.street?.trim() || next.street,
            unit: json.address.unit?.trim() || next.unit,
            city: json.address.city?.trim() || next.city,
            state: json.address.state?.trim() || next.state,
            zip: json.address.zip?.trim() || next.zip,
          };
        }
        if (json.vehicle) {
          next = {
            ...next,
            vehicleYear: json.vehicle.year?.trim() || next.vehicleYear,
            vehicleMake: json.vehicle.make?.trim() || next.vehicleMake,
            vehicleModel: json.vehicle.model?.trim() || next.vehicleModel,
          };
        }
        saved = Boolean(json.hasUsableAddress || json.hasVehicle);
      }
      setDetails(next);
      setUsedSavedDetails(saved);
      // Always show prefilled details so the customer can confirm or edit.
      setStep(needsAddress || needsVehicle ? 'serviceDetails' : 'firstVisit');
    } catch {
      setUsedSavedDetails(false);
      setStep(needsAddress || needsVehicle ? 'serviceDetails' : 'firstVisit');
    } finally {
      setIsContinuing(false);
    }
  };

  const handleCheckout = async () => {
    if (!firstVisitDate) {
      toast.warning(ui.subscriptions.firstVisitRequired);
      return;
    }
    if (!firstVisitTime?.trim()) {
      toast.warning(ui.subscriptions.firstVisitTimeRequired);
      return;
    }
    if (
      !isMembershipServiceDetailsComplete({
        value: details,
        needsAddress,
        needsVehicle,
      })
    ) {
      toast.warning(ui.subscriptions.serviceDetailsIncomplete);
      setStep('serviceDetails');
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
          street: needsAddress ? details.street.trim() : '',
          unit: needsAddress ? details.unit.trim() : '',
          city: needsAddress ? details.city.trim() : '',
          state: needsAddress ? details.state.trim() : '',
          zip: needsAddress ? details.zip.trim() : '',
          vehicleYear: details.vehicleYear.trim(),
          vehicleMake: details.vehicleMake.trim(),
          vehicleModel: details.vehicleModel.trim(),
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

  const goBack = () => {
    if (step === 'firstVisit') {
      setStep(needsAddress || needsVehicle ? 'serviceDetails' : 'contact');
      return;
    }
    if (step === 'serviceDetails') {
      setStep('contact');
      return;
    }
    if (step === 'contact') {
      setStep('howItWorks');
      return;
    }
  };

  const canPay = Boolean(firstVisitDate && firstVisitTime);

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className={publicFlowStickyBackHeaderClassName}>
        <div className="mx-auto flex min-h-[52px] w-full max-w-2xl items-center px-4 sm:px-6">
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
              onClick={goBack}
            >
              <PublicFlowBackChevron />
              <span>{ui.subscriptions.subscribeStepBackLabel}</span>
            </button>
          )}
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8">
        <div
          className="mb-6 flex items-center gap-2"
          aria-label={`${stepIndex + 1} of 4`}
        >
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-white' : 'bg-white/25'
              }`}
            />
          ))}
        </div>

        {step === 'howItWorks' ? (
          <section aria-labelledby="subscribe-how-heading">
            <PublicMembershipStepHeading
              id="subscribe-how-heading"
              title={ui.subscriptions.howItWorksTitle}
              className="mb-8"
            />

            <ol className="relative">
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
                    <div className="min-w-0 space-y-0.5 pt-1.5">
                      <p className="text-sm font-semibold text-white">
                        {item.title}
                      </p>
                      <p className="text-sm leading-snug text-zinc-400">
                        {item.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {step === 'contact' ? (
          <section
            aria-labelledby="subscribe-contact-heading"
            className="space-y-6"
          >
            <PublicMembershipStepHeading
              id="subscribe-contact-heading"
              title={ui.subscriptions.contactTitle}
              hint={ui.subscriptions.contactHint}
            />
            <MembershipServiceDetailsFields
              value={details}
              onChange={setDetails}
              showContact
              showAddress={false}
              showVehicle={false}
              bookingFlowLocale={bookingFlowLocale}
            />
          </section>
        ) : null}

        {step === 'serviceDetails' ? (
          <section
            aria-labelledby="subscribe-details-heading"
            className="space-y-6"
          >
            <PublicMembershipStepHeading
              id="subscribe-details-heading"
              title={ui.subscriptions.serviceDetailsTitle}
              hint={ui.subscriptions.serviceDetailsHint}
            />
            <MembershipServiceDetailsFields
              value={details}
              onChange={setDetails}
              showContact={false}
              showAddress={needsAddress}
              showVehicle={needsVehicle}
              savedBanner={
                usedSavedDetails ? ui.subscriptions.usingSavedDetails : null
              }
              bookingFlowLocale={bookingFlowLocale}
            />
          </section>
        ) : null}

        {step === 'firstVisit' ? (
          <section
            aria-labelledby="subscribe-visit-heading"
            className="space-y-6"
          >
            <PublicMembershipStepHeading
              id="subscribe-visit-heading"
              title={ui.subscriptions.firstVisitTitle}
              hint={ui.subscriptions.firstVisitHint}
            />

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 lg:p-5">
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

            <div>
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
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:py-4">
        <div className="mx-auto w-full max-w-2xl">
          {step === 'howItWorks' ? (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              size={isLargeScreen ? 'lg' : 'sm'}
              onClick={() => setStep('contact')}
            >
              {ui.subscriptions.howItWorksContinueCta}
            </Button>
          ) : null}

          {step === 'contact' ? (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              size={isLargeScreen ? 'lg' : 'sm'}
              loading={isContinuing}
              disabled={isContinuing}
              onClick={() => void lookupAndAdvanceFromContact()}
            >
              {ui.subscriptions.contactContinueCta}
            </Button>
          ) : null}

          {step === 'serviceDetails' ? (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              size={isLargeScreen ? 'lg' : 'sm'}
              onClick={() => {
                if (
                  !isMembershipServiceDetailsComplete({
                    value: details,
                    needsAddress,
                    needsVehicle,
                  })
                ) {
                  toast.warning(ui.subscriptions.serviceDetailsIncomplete);
                  return;
                }
                setStep('firstVisit');
              }}
            >
              {ui.subscriptions.serviceDetailsContinueCta}
            </Button>
          ) : null}

          {step === 'firstVisit' ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
};
