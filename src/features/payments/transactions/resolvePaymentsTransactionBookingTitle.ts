import { bookingServiceNameParts } from '@/features/availability/booking/dashboard/utils/bookingCardServiceTitle';
import { parseStoredBookingJobDetails } from '@/features/availability/booking/utils/parseStoredBookingJobDetails';

const PLACEHOLDER_TITLES = new Set([
  'mixed jobs',
  'double jobs',
  'payment',
  'refund',
  'card payment',
  'charge',
  'payout to your bank',
  'payout',
  'service',
]);

export function isUnusablePaymentsTransactionTitle(title: string): boolean {
  return PLACEHOLDER_TITLES.has(title.trim().toLowerCase());
}

export function resolvePaymentsTransactionBookingTitle(args: {
  serviceName?: string | null;
  jobDetails?: unknown;
}): {
  title: string | null;
  extraCount: number;
  serviceName: string | null;
  jobCount: number;
} {
  const jobs = parseStoredBookingJobDetails(args.jobDetails);
  if (jobs.length > 0) {
    const first = stripServicePriceTier(jobs[0].serviceName);
    if (first && !isUnusablePaymentsTransactionTitle(first)) {
      return {
        title: first,
        extraCount: Math.max(0, jobs.length - 1),
        serviceName: first,
        jobCount: jobs.length,
      };
    }
  }

  const stored = (args.serviceName ?? '').trim();
  const moreMatch = stored.match(/^(.*) \+ (\d+) more$/);
  if (moreMatch) {
    const extra = Number(moreMatch[2]);
    const first = stripServicePriceTier(moreMatch[1] ?? '');
    const extraCount = Number.isFinite(extra) && extra > 0 ? extra : 0;
    if (first && !isUnusablePaymentsTransactionTitle(first)) {
      return {
        title: first,
        extraCount,
        serviceName: first,
        jobCount: extraCount + 1,
      };
    }
  }

  if (!stored) {
    return { title: null, extraCount: 0, serviceName: null, jobCount: 0 };
  }

  const first = stripServicePriceTier(stored);
  if (!first || isUnusablePaymentsTransactionTitle(first)) {
    return { title: null, extraCount: 0, serviceName: null, jobCount: 0 };
  }

  return {
    title: first,
    extraCount: 0,
    serviceName: first,
    jobCount: 1,
  };
}

export function stripServicePriceTier(serviceName: string): string {
  return bookingServiceNameParts(serviceName).name;
}
