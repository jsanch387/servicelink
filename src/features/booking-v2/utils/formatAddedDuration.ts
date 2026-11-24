import type { PublicBookingFlowLocale } from '@/constants/routes';

/** Extra time on an add-on, e.g. "+ 30 min" or "+ 1 hr". */
export function formatAddedDuration(
  minutes: number | null | undefined,
  locale: PublicBookingFlowLocale = 'en'
): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `+ ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const hourLabel = locale === 'es' ? 'h' : hours === 1 ? 'hr' : 'hrs';

  if (remainder === 0) return `+ ${hours} ${hourLabel}`;
  return `+ ${hours} ${hourLabel} ${remainder} min`;
}
