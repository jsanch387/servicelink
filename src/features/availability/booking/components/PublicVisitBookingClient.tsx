'use client';

import {
  getBusinessBookDetailsPath,
  getBusinessBookPath,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import type { PublicBookingPaymentSettings } from '../types';
import type { WeeklySchedule } from '../../types/availability';
import { DEFAULT_SCHEDULE } from '../../types/availability';
import type { TimeOffInterval } from '../types';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AvailabilityBookingPage } from './AvailabilityBookingPage';
import { BookFlowLoadingState } from './BookFlowLoadingState';
import {
  clearPublicBookingJobsCart,
  loadPublicBookingJobsCart,
  publicBookingVisitServiceNameSummary,
  removePublicBookingJob,
  sumPublicBookingJobsDurationMinutes,
  type PublicBookingJobDraft,
} from '../utils/publicBookingJobsCart';
import { PUBLIC_BOOKING_MAX_JOBS } from '../constants/publicBookingJobs';

type PublicVisitBookingClientProps = {
  businessName: string;
  businessId: string;
  businessSlug: string;
  showVehicleFields?: boolean;
  weeklySchedule?: WeeklySchedule | null;
  timeOffBlocks?: TimeOffInterval[];
  minimumNotice?: string;
  paymentSettings?: PublicBookingPaymentSettings | null;
  bookingFlowLocale?: PublicBookingFlowLocale;
  serviceLocation: PublicBookingServiceLocation;
  initialCustomerServiceChoice?: 'mobile' | 'shop' | null;
  activeSale?: PublicActiveSale | null;
  stripeCheckoutSessionId?: string | null;
  exitCalendarFlowHref: string;
  exitCalendarFlowLabel: string;
};

/**
 * Client bridge for `/book?visit=1` — loads the multi-job cart and drives
 * {@link AvailabilityBookingPage} with summed duration/price.
 */
export function PublicVisitBookingClient({
  businessName,
  businessId,
  businessSlug,
  showVehicleFields = false,
  weeklySchedule,
  timeOffBlocks,
  minimumNotice,
  paymentSettings,
  bookingFlowLocale = 'en',
  serviceLocation,
  initialCustomerServiceChoice,
  activeSale,
  stripeCheckoutSessionId,
  exitCalendarFlowHref,
  exitCalendarFlowLabel,
}: PublicVisitBookingClientProps) {
  const router = useRouter();
  const ui = publicBookingUi(bookingFlowLocale);
  const [jobs, setJobs] = useState<PublicBookingJobDraft[] | null>(null);
  const [locationChoice, setLocationChoice] = useState<
    'mobile' | 'shop' | null
  >(initialCustomerServiceChoice ?? null);

  useEffect(() => {
    const cart = loadPublicBookingJobsCart(businessSlug);
    if (!cart || cart.jobs.length < 1) {
      router.replace(
        getBusinessBookPath(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    setJobs(cart.jobs);
    if (cart.serviceLocationType) {
      setLocationChoice(cart.serviceLocationType);
    } else if (initialCustomerServiceChoice) {
      setLocationChoice(initialCustomerServiceChoice);
    }
  }, [businessSlug, bookingFlowLocale, initialCustomerServiceChoice, router]);

  const addAnotherHref = useMemo(() => {
    if (!jobs || jobs.length >= PUBLIC_BOOKING_MAX_JOBS) return undefined;
    return getBusinessBookPath(businessSlug, {
      lang: bookingFlowLocale,
      addJob: true,
    });
  }, [jobs, businessSlug, bookingFlowLocale]);

  /** Calendar back: edit the one service, or manage services without wiping the cart. */
  const resolvedExit = useMemo(() => {
    if (!jobs || jobs.length < 1) {
      return { href: exitCalendarFlowHref, label: exitCalendarFlowLabel };
    }
    if (jobs.length === 1) {
      return {
        href: getBusinessBookDetailsPath(businessSlug, jobs[0].serviceId, {
          lang: bookingFlowLocale,
          // Explicit edit — keep contact/schedule; do not treat as a fresh start.
          editVisit: true,
        }),
        label: ui.nav.backToService,
      };
    }
    return {
      href: getBusinessBookPath(businessSlug, {
        lang: bookingFlowLocale,
        addJob: true,
      }),
      label: ui.nav.backToServices,
    };
  }, [
    jobs,
    businessSlug,
    bookingFlowLocale,
    exitCalendarFlowHref,
    exitCalendarFlowLabel,
    ui.nav.backToService,
    ui.nav.backToServices,
  ]);

  const handleRemoveJob = (localId: string) => {
    const next = removePublicBookingJob(businessSlug, localId);
    if (!next) {
      router.replace(
        getBusinessBookPath(businessSlug, { lang: bookingFlowLocale })
      );
      return;
    }
    setJobs(next.jobs);
  };

  const handleBookingCreated = useCallback(() => {
    clearPublicBookingJobsCart(businessSlug);
  }, [businessSlug]);

  if (!jobs) {
    return <BookFlowLoadingState />;
  }

  const serviceName = publicBookingVisitServiceNameSummary(jobs);
  const durationMinutes = sumPublicBookingJobsDurationMinutes(jobs);
  const servicePriceOnly = jobs.reduce((s, j) => s + j.servicePriceCents, 0);
  const flatAddOns = jobs.flatMap(j => j.selectedAddOns);

  return (
    <AvailabilityBookingPage
      businessName={businessName}
      businessId={businessId}
      businessSlug={businessSlug}
      showVehicleFields={showVehicleFields}
      serviceName={serviceName}
      serviceDurationMinutes={durationMinutes}
      servicePriceCents={servicePriceOnly}
      selectedAddOns={flatAddOns.map(a => ({
        id: a.id,
        name: a.name,
        priceCents: a.priceCents,
        durationMinutes: a.durationMinutes,
      }))}
      weeklySchedule={weeklySchedule ?? DEFAULT_SCHEDULE}
      timeOffBlocks={timeOffBlocks}
      minimumNotice={minimumNotice}
      paymentSettings={paymentSettings}
      bookingFlowLocale={bookingFlowLocale}
      exitCalendarFlowHref={resolvedExit.href}
      exitCalendarFlowLabel={resolvedExit.label}
      stripeCheckoutSessionId={stripeCheckoutSessionId}
      serviceLocation={serviceLocation}
      initialCustomerServiceChoice={locationChoice}
      activeSale={activeSale}
      bookingJobs={jobs}
      addAnotherJobHref={addAnotherHref}
      onRemoveBookingJob={handleRemoveJob}
      onBookingJobsChange={setJobs}
      onPublicMultiJobBookingCreated={handleBookingCreated}
    />
  );
}
