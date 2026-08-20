'use client';

import {
  Button,
  PublicFlowBackChevron,
  publicFlowBackNavClassName,
  publicFlowStickyBackHeaderClassName,
  toast,
  useScrollWindowToTopOnChange,
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
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type { OwnerSubscriberVisitStatus } from '../types/ownerSubscriptionPlan';
import { formatMembershipVisitWhen } from '../utils/formatMembershipVisitWhen';
import {
  isYmdInInclusiveRange,
  localTodayYmd,
  ymdToLocalDate,
} from '../utils/membershipPeriodVisitDateBounds';
import { isMembershipServiceDetailsComplete } from '../utils/membershipServiceDetailsComplete';
import {
  EMPTY_MEMBERSHIP_SERVICE_DETAILS,
  MembershipServiceDetailsFields,
  type MembershipServiceDetailsValue,
} from './MembershipServiceDetailsFields';
import { PublicMembershipStepHeading } from './PublicMembershipStepHeading';
import { PublicMembershipSuccessScreen } from './PublicMembershipSuccessScreen';

type VisitStep = 'details' | 'schedule';

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
  needsAddress?: boolean;
  needsVehicle?: boolean;
  /** True when CRM already has address/vehicle — show the saved-details banner. */
  serviceDetailsComplete?: boolean;
  /** Prefill came from a saved CRM customer. */
  usingSavedDetails?: boolean;
  initialAddress?: {
    street: string;
    unit: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  initialVehicle?: { year: string; make: string; model: string } | null;
  visitMinDate?: string | null;
  visitMaxDate?: string | null;
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
 * Same stepper pattern as subscribe: confirm details, then pick a slot.
 * Address can change; the membership vehicle cannot.
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
  needsAddress = true,
  needsVehicle = true,
  serviceDetailsComplete = false,
  usingSavedDetails = false,
  initialAddress = null,
  initialVehicle = null,
  visitMinDate = null,
  visitMaxDate = null,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const isLargeScreen = useIsLargeScreen();
  const [step, setStep] = useState<VisitStep>('details');
  const [visitDate, setVisitDate] = useState<Date | null>(null);
  const [visitTime, setVisitTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [details, setDetails] = useState<MembershipServiceDetailsValue>(() => ({
    ...EMPTY_MEMBERSHIP_SERVICE_DETAILS,
    street: initialAddress?.street ?? '',
    unit: initialAddress?.unit ?? '',
    city: initialAddress?.city ?? '',
    state: initialAddress?.state ?? '',
    zip: initialAddress?.zip ?? '',
    vehicleYear: initialVehicle?.year ?? '',
    vehicleMake: initialVehicle?.make ?? '',
    vehicleModel: initialVehicle?.model ?? '',
  }));
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
    canSchedule && step === 'schedule' ? businessSlug : undefined
  );

  useScrollWindowToTopOnChange([step]);

  useEffect(() => {
    setVisitTime(null);
  }, [visitDate]);

  const profileHref = getPublicBusinessProfilePath(businessSlug, {
    lang: bookingFlowLocale,
  });

  const visitDateBounds = useMemo(() => {
    if (!visitMinDate || !visitMaxDate) return null;
    return { minYmd: visitMinDate, maxYmd: visitMaxDate };
  }, [visitMinDate, visitMaxDate]);
  const calendarMinDate = useMemo(() => {
    const fromBounds = visitMinDate ? ymdToLocalDate(visitMinDate) : null;
    const today = ymdToLocalDate(localTodayYmd());
    if (fromBounds && today && fromBounds.getTime() > today.getTime()) {
      return fromBounds;
    }
    return today ?? new Date();
  }, [visitMinDate]);
  const calendarMaxDate = useMemo(() => {
    if (!visitMaxDate) return undefined;
    return ymdToLocalDate(visitMaxDate) ?? undefined;
  }, [visitMaxDate]);

  const detailsComplete = isMembershipServiceDetailsComplete({
    value: details,
    needsAddress,
    needsVehicle,
    vehicleLocked: true,
  });

  const handleContinueFromDetails = () => {
    if (!detailsComplete) {
      toast.warning(ui.subscriptions.periodVisitAddressIncomplete);
      return;
    }
    setStep('schedule');
  };

  const handleBook = async () => {
    if (!visitDate) {
      toast.warning(ui.subscriptions.periodVisitDateRequired);
      return;
    }
    const visitYmd = [
      visitDate.getFullYear(),
      String(visitDate.getMonth() + 1).padStart(2, '0'),
      String(visitDate.getDate()).padStart(2, '0'),
    ].join('-');
    if (visitDateBounds && !isYmdInInclusiveRange(visitYmd, visitDateBounds)) {
      toast.warning(ui.subscriptions.periodVisitDateOutOfPeriod);
      return;
    }
    if (!visitTime?.trim()) {
      toast.warning(ui.subscriptions.periodVisitTimeRequired);
      return;
    }
    if (!detailsComplete) {
      toast.warning(ui.subscriptions.periodVisitAddressIncomplete);
      setStep('details');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(API_ROUTES.PUBLIC_MEMBERSHIPS_VISIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          businessSlug,
          visitDate: visitYmd,
          visitTime: visitTime.trim().slice(0, 5),
          street: needsAddress ? details.street.trim() : '',
          unit: needsAddress ? details.unit.trim() : '',
          city: needsAddress ? details.city.trim() : '',
          state: needsAddress ? details.state.trim() : '',
          zip: needsAddress ? details.zip.trim() : '',
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
          <div className="mx-auto flex min-h-[52px] w-full max-w-2xl items-center px-4 sm:px-6">
            <Link href={profileHref} className={publicFlowBackNavClassName}>
              <PublicFlowBackChevron />
              <span>{businessName}</span>
            </Link>
          </div>
        </div>
        <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
          <PublicMembershipStepHeading
            id="period-visit-inactive-heading"
            title={ui.subscriptions.periodVisitInactiveTitle}
            hint={ui.subscriptions.periodVisitInactiveBody}
          />
        </main>
      </div>
    );
  }

  if (visitStatus === 'completed') {
    return (
      <PublicMembershipSuccessScreen
        title={ui.subscriptions.periodVisitCompletedTitle}
        body={ui.subscriptions.periodVisitCompletedBody(
          planName,
          formatMembershipVisitWhen(
            periodVisitDate ?? '',
            periodVisitTime ?? '',
            bookingFlowLocale
          )
        )}
        doneHref={profileHref}
        doneLabel={ui.subscriptions.successDoneCta}
      />
    );
  }

  if (booked) {
    return (
      <PublicMembershipSuccessScreen
        title={ui.subscriptions.periodVisitScheduledTitle}
        body={ui.subscriptions.periodVisitScheduledBody(
          planName,
          formatMembershipVisitWhen(
            booked.scheduledDate,
            booked.startTime,
            bookingFlowLocale
          )
        )}
        doneHref={profileHref}
        doneLabel={ui.subscriptions.successDoneCta}
      />
    );
  }

  const stepIndex = step === 'details' ? 0 : 1;
  const canSubmit = Boolean(visitDate && visitTime) && detailsComplete;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className={publicFlowStickyBackHeaderClassName}>
        <div className="mx-auto flex min-h-[52px] w-full max-w-2xl items-center px-4 sm:px-6">
          {step === 'details' ? (
            <Link href={profileHref} className={publicFlowBackNavClassName}>
              <PublicFlowBackChevron />
              <span>{businessName}</span>
            </Link>
          ) : (
            <button
              type="button"
              className={publicFlowBackNavClassName}
              onClick={() => setStep('details')}
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
          aria-label={`${stepIndex + 1} of 2`}
        >
          {[0, 1].map(i => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-white' : 'bg-white/25'
              }`}
            />
          ))}
        </div>

        {step === 'details' ? (
          <section
            aria-labelledby="period-visit-details-heading"
            className="space-y-6"
          >
            <PublicMembershipStepHeading
              id="period-visit-details-heading"
              title={ui.subscriptions.serviceDetailsTitle}
              hint={
                needsAddress
                  ? ui.subscriptions.periodVisitDetailsHint
                  : ui.subscriptions.periodVisitDetailsHintShop
              }
            />
            <MembershipServiceDetailsFields
              value={details}
              onChange={setDetails}
              showContact={false}
              showAddress={needsAddress}
              showVehicle={needsVehicle}
              vehicleReadOnly
              savedBanner={
                needsAddress && (usingSavedDetails || serviceDetailsComplete)
                  ? ui.subscriptions.periodVisitUsingSavedDetails
                  : null
              }
              bookingFlowLocale={bookingFlowLocale}
            />
          </section>
        ) : null}

        {step === 'schedule' ? (
          <section aria-labelledby="period-visit-heading" className="space-y-6">
            <PublicMembershipStepHeading
              id="period-visit-heading"
              title={ui.subscriptions.periodVisitTitle}
              hint={ui.subscriptions.periodVisitHint(planName)}
            />

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4 lg:p-5">
              <DateSelector
                weeklySchedule={weeklySchedule}
                serviceDurationMinutes={visitDurationMinutes}
                existingBookings={blockedSlots}
                timeOffBlocks={timeOffBlocks}
                minimumNotice={minimumNotice}
                selectedDate={visitDate}
                onSelectDate={setVisitDate}
                minDate={calendarMinDate}
                maxDate={calendarMaxDate}
                calendarSubtitle={
                  visitDateBounds &&
                  visitMinDate &&
                  visitMinDate > localTodayYmd()
                    ? ui.subscriptions.periodVisitCalendarSubtitle
                    : undefined
                }
                plainCalendar
                compactCalendar={!isLargeScreen}
                bookingFlowLocale={bookingFlowLocale}
                requireAvailableSlots={schedulingReady}
              />
            </div>

            <div>
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
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:py-4">
        <div className="mx-auto w-full max-w-2xl">
          {step === 'details' ? (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              size={isLargeScreen ? 'lg' : 'sm'}
              onClick={handleContinueFromDetails}
            >
              {ui.subscriptions.serviceDetailsContinueCta}
            </Button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};
