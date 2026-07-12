import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatMarketingCalendarDate } from './marketingCalendarDate';

function formatShortDate(date: Date, locale: PublicBookingFlowLocale): string {
  return formatMarketingCalendarDate(date, locale === 'es' ? 'es-US' : 'en-US');
}

type SaleBannerDateLabels = {
  validPrefix: string;
  throughPrefix: string;
  dateRange: (start: string, end: string) => string;
  through: (date: string) => string;
  fromThrough: (start: string, end: string) => string;
};

export type PublicSaleBannerTiming = {
  prefix: string;
  dates: string;
  fullLabel: string;
};

export function getPublicSaleBannerTiming(
  startsAt: Date | undefined,
  endsAt: Date | undefined,
  locale: PublicBookingFlowLocale,
  labels: SaleBannerDateLabels
): PublicSaleBannerTiming | null {
  if (!startsAt && !endsAt) return null;

  if (startsAt && endsAt) {
    const start = formatShortDate(startsAt, locale);
    const end = formatShortDate(endsAt, locale);
    return {
      prefix: labels.validPrefix,
      dates: labels.dateRange(start, end),
      fullLabel: labels.fromThrough(start, end),
    };
  }

  if (endsAt) {
    const date = formatShortDate(endsAt, locale);
    return {
      prefix: labels.throughPrefix,
      dates: date,
      fullLabel: labels.through(date),
    };
  }

  if (startsAt) {
    const date = formatShortDate(startsAt, locale);
    return {
      prefix: labels.throughPrefix,
      dates: date,
      fullLabel: labels.through(date),
    };
  }

  return null;
}

export function formatPublicSaleBannerDates(
  startsAt: Date | undefined,
  endsAt: Date | undefined,
  locale: PublicBookingFlowLocale,
  labels: SaleBannerDateLabels
): string | null {
  return (
    getPublicSaleBannerTiming(startsAt, endsAt, locale, labels)?.fullLabel ??
    null
  );
}
