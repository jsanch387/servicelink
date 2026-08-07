'use client';

import { toast } from '@/components/shared';
import {
  getBusinessBookPath,
  getBusinessBookVisitUrl,
} from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BookFlowLoadingState } from './BookFlowLoadingState';
import {
  appendPublicBookingJob,
  clearPublicBookingJobsCart,
  loadPublicBookingJobsCart,
  replacePublicBookingVisitJob,
} from '../utils/publicBookingJobsCart';
import type { AddOnAtBooking } from '../types';
import { PUBLIC_BOOKING_MAX_JOBS } from '../constants/publicBookingJobs';

type CommitPublicJobAndRedirectProps = {
  businessSlug: string;
  serviceId: string;
  serviceName: string;
  servicePriceOptionLabel?: string | null;
  servicePriceCents: number;
  durationMinutes: number;
  selectedAddOns?: AddOnAtBooking[];
  serviceLocationType?: 'mobile' | 'shop';
  lang?: PublicBookingFlowLocale | null;
  /** When true, append to the existing visit cart; otherwise replace. */
  addingAnotherJob?: boolean;
  /** When true, replace the sole visit job and keep contact/schedule draft. */
  editingVisitJob?: boolean;
};

/**
 * Commits the configured catalog job into the visit cart, then opens `/book?visit=1`.
 * Used when `/book/details` has nothing to configure (skip details).
 */
export function CommitPublicJobAndRedirect({
  businessSlug,
  serviceId,
  serviceName,
  servicePriceOptionLabel,
  servicePriceCents,
  durationMinutes,
  selectedAddOns = [],
  serviceLocationType,
  lang,
  addingAnotherJob = false,
  editingVisitJob = false,
}: CommitPublicJobAndRedirectProps) {
  const router = useRouter();
  const started = useRef(false);
  const ui = publicBookingUi(lang ?? 'en');

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const existing = loadPublicBookingJobsCart(businessSlug);
    const keepVisitDraft =
      editingVisitJob &&
      !addingAnotherJob &&
      (existing?.jobs.length ?? 0) === 1;

    if (!addingAnotherJob && !keepVisitDraft) {
      clearPublicBookingJobsCart(businessSlug);
    } else if (
      addingAnotherJob &&
      (existing?.jobs.length ?? 0) >= PUBLIC_BOOKING_MAX_JOBS
    ) {
      toast.error(ui.multiJob.maxJobsReachedToast);
      router.replace(
        getBusinessBookVisitUrl(businessSlug, {
          serviceLocationType,
          lang,
        })
      );
      return;
    }

    const job = {
      serviceId,
      serviceName,
      servicePriceOptionLabel: servicePriceOptionLabel ?? null,
      servicePriceCents,
      durationMinutes,
      selectedAddOns,
      vehicle: keepVisitDraft
        ? (existing!.jobs[0].vehicle ?? { year: '', make: '', model: '' })
        : { year: '', make: '', model: '' },
    };

    const result = keepVisitDraft
      ? replacePublicBookingVisitJob({
          businessSlug,
          serviceLocationType,
          job,
        })
      : appendPublicBookingJob({
          businessSlug,
          serviceLocationType,
          job,
        });

    if (!result.ok) {
      toast.error(
        result.reason === 'max_jobs'
          ? ui.multiJob.maxJobsReachedToast
          : ui.multiJob.couldNotAddServiceToast
      );
      router.replace(
        addingAnotherJob
          ? getBusinessBookVisitUrl(businessSlug, {
              serviceLocationType,
              lang,
            })
          : getBusinessBookPath(businessSlug, { lang })
      );
      return;
    }

    router.replace(
      getBusinessBookVisitUrl(businessSlug, {
        serviceLocationType,
        lang,
      })
    );
  }, [
    addingAnotherJob,
    editingVisitJob,
    businessSlug,
    serviceId,
    serviceName,
    servicePriceOptionLabel,
    servicePriceCents,
    durationMinutes,
    selectedAddOns,
    serviceLocationType,
    lang,
    router,
    ui.multiJob.maxJobsReachedToast,
    ui.multiJob.couldNotAddServiceToast,
  ]);

  return <BookFlowLoadingState />;
}
