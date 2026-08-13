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
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type { OwnerSubscriberVisitStatus } from '../types/ownerSubscriptionPlan';

interface PublicMembershipVisitPageProps {
  businessSlug: string;
  businessName: string;
  token: string;
  planName: string;
  customerName: string;
  visitStatus: OwnerSubscriberVisitStatus;
  periodVisitDate: string | null;
  periodVisitTime: string | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  minimumNotice: string;
  schedulingReady: boolean;
  visitDurationMinutes?: number;
}

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
 * Public next-period visit scheduler (token from reminder email/SMS).
 */
export const PublicMembershipVisitPage: React.FC<
  PublicMembershipVisitPageProps
> = ({
  businessSlug,
  businessName,
  token,
  planName,
  visitStatus,
  periodVisitDate,
  periodVisitTime,
  bookingFlowLocale = 'en',
  weeklySchedule,
  timeOffBlocks,
  minimumNotice,
  schedulingReady,
  visitDurationMinutes = MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const isLargeScreen = useIsLargeScreen();
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [visitTime, setVisitTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<{
    scheduledDate: string;
    startTime: string;
  } | null>(
    visitStatus === 'scheduled' && periodVisitDate
      ? {
          scheduledDate: periodVisitDate,
          startTime: periodVisitTime || '',
        }
      : null
  );

  const canSchedule = visitStatus === 'needs_visit' && !booked;
  const { blockedSlots } = usePublicBlockedSlots(
    canSchedule ? businessSlug : undefined
  );

  useEffect(() => {
    setVisitTime(null);
  }, [visitDate]);

  const profileHref = getPublicBusinessProfilePath(businessSlug, {
    lang: bookingFlowLocale,
  });

  const handleBook = async () => {
    if (!visitDate) {
      toast.warning(ui.subscriptions.periodVisitDateRequired);
      return;
    }
    if (!visitTime?.trim()) {
      toast.warning(ui.subscriptions.periodVisitTimeRequired);
      return;
    }

    setSubmitting(true);
    try {
      const visitYmd = [
        visitDate.getFullYear(),
        String(visitDate.getMonth() + 1).padStart(2, '0'),
        String(visitDate.getDate()).padStart(2, '0'),
      ].join('-');

      const res = await fetch(API_ROUTES.PUBLIC_MEMBERSHIPS_VISIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          businessSlug,
          visitDate: visitYmd,
          visitTime: visitTime.trim().slice(0, 5),
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        scheduledDate?: string;
        startTime?: string;
      } | null;

      if (!res.ok || !json?.success || !json.scheduledDate) {
        toast.error(json?.error ?? ui.subscriptions.periodVisitBookFailed);
        return;
      }

      setBooked({
        scheduledDate: json.scheduledDate,
        startTime: json.startTime?.trim() || '',
      });
      toast.success(ui.subscriptions.periodVisitBookSuccess);
    } catch {
      toast.error(ui.subscriptions.periodVisitBookFailed);
    } finally {
      setSubmitting(false);
    }
  };

  if (visitStatus === 'none') {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)]">
        <div className={publicFlowStickyBackHeaderClassName}>
          <div className="mx-auto flex min-h-[52px] w-full max-w-md items-center px-4 sm:max-w-lg sm:px-6 lg:max-w-xl">
            <Link href={profileHref} className={publicFlowBackNavClassName}>
              <PublicFlowBackChevron />
              <span>{businessName}</span>
            </Link>
          </div>
        </div>
        <main className="mx-auto w-full max-w-md px-4 py-10 sm:max-w-lg sm:px-6">
          <h1 className="text-2xl font-black tracking-tight text-white">
            {ui.subscriptions.periodVisitInactiveTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {ui.subscriptions.periodVisitInactiveBody}
          </p>
        </main>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-[var(--dashboard-bg)]">
        <div className={publicFlowStickyBackHeaderClassName}>
          <div className="mx-auto flex min-h-[52px] w-full max-w-md items-center px-4 sm:max-w-lg sm:px-6 lg:max-w-xl">
            <Link href={profileHref} className={publicFlowBackNavClassName}>
              <PublicFlowBackChevron />
              <span>{businessName}</span>
            </Link>
          </div>
        </div>
        <main className="mx-auto w-full max-w-md px-4 py-10 sm:max-w-lg sm:px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <CheckCircleIcon className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
            {ui.subscriptions.periodVisitScheduledTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {ui.subscriptions.periodVisitScheduledBody(
              planName,
              booked.scheduledDate,
              booked.startTime
            )}
          </p>
          <div className="mt-8">
            <Button
              type="button"
              variant="inverse"
              fullWidth
              href={profileHref}
            >
              {ui.subscriptions.successDoneCta}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const canSubmit = Boolean(visitDate && visitTime);

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className={publicFlowStickyBackHeaderClassName}>
        <div className="mx-auto flex min-h-[52px] w-full max-w-md items-center px-4 sm:max-w-lg sm:px-6 lg:max-w-xl">
          <Link href={profileHref} className={publicFlowBackNavClassName}>
            <PublicFlowBackChevron />
            <span>{businessName}</span>
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-md px-4 pb-32 pt-6 sm:max-w-lg sm:px-6 sm:pt-8 lg:max-w-xl">
        <section aria-labelledby="period-visit-heading">
          <h1
            id="period-visit-heading"
            className="text-2xl font-black tracking-tight text-white sm:text-[1.75rem]"
          >
            {ui.subscriptions.periodVisitTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {ui.subscriptions.periodVisitHint(planName)}
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 lg:p-5">
            <DateSelector
              weeklySchedule={weeklySchedule}
              serviceDurationMinutes={visitDurationMinutes}
              existingBookings={blockedSlots}
              timeOffBlocks={timeOffBlocks}
              minimumNotice={minimumNotice}
              selectedDate={visitDate}
              onSelectDate={setVisitDate}
              plainCalendar
              compactCalendar={!isLargeScreen}
              bookingFlowLocale={bookingFlowLocale}
              requireAvailableSlots={schedulingReady}
            />
          </div>

          <div className="mt-6 lg:mt-8">
            <TimeSlotGrid
              selectedDate={visitDate}
              serviceDurationMinutes={visitDurationMinutes}
              weeklySchedule={weeklySchedule}
              existingBookings={blockedSlots}
              timeOffBlocks={timeOffBlocks}
              minimumNotice={minimumNotice}
              selectedTime={visitTime}
              onSelectTime={setVisitTime}
              compact={!isLargeScreen}
              heading={ui.subscriptions.periodVisitTimeTitle}
              noSlotsHint={ui.subscriptions.periodVisitNoSlots}
              autoSelectFirstAvailable={false}
            />
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:py-4">
        <div className="mx-auto w-full max-w-md sm:max-w-lg lg:max-w-xl">
          <Button
            type="button"
            variant="inverse"
            fullWidth
            size={isLargeScreen ? 'lg' : 'sm'}
            loading={submitting}
            disabled={submitting || !canSubmit}
            onClick={() => void handleBook()}
          >
            {ui.subscriptions.periodVisitConfirmCta}
          </Button>
        </div>
      </div>
    </div>
  );
};
