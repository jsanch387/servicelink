import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import type {
  SubscriptionCadenceOption,
  SubscriptionCadenceUnit,
} from '../types/customerSubscriptionPlan';

export function formatSubscriptionPriceCents(
  priceCents: number,
  locale: PublicBookingFlowLocale = 'en'
): string {
  if (priceCents <= 0) {
    return publicBookingUi(locale).subscriptions.contactForPrice;
  }
  return `$${(priceCents / 100).toFixed(0)}`;
}

/** Short suffix next to the price, e.g. "/mo", "/2wk". */
export function formatCadencePriceSuffix(
  option: Pick<SubscriptionCadenceOption, 'intervalUnit' | 'intervalCount'>,
  locale: PublicBookingFlowLocale = 'en'
): string {
  const { intervalUnit, intervalCount } = option;
  const count = Math.max(1, intervalCount);
  const suffix = publicBookingUi(locale).subscriptions.cadenceSuffix;

  if (intervalUnit === 'week') {
    return count === 1 ? suffix.week : suffix.weeks(count);
  }
  if (intervalUnit === 'month') {
    return count === 1 ? suffix.month : suffix.months(count);
  }
  return count === 1 ? suffix.year : suffix.years(count);
}

/** Human label for the cadence picker, e.g. "Every 2 weeks". */
export function formatCadenceOptionLabel(
  option: Pick<SubscriptionCadenceOption, 'intervalUnit' | 'intervalCount'>,
  locale: PublicBookingFlowLocale = 'en'
): string {
  const { intervalUnit, intervalCount } = option;
  const count = Math.max(1, intervalCount);
  const labels = publicBookingUi(locale).subscriptions.cadenceLabel;

  if (intervalUnit === 'week') {
    return count === 1 ? labels.weekly : labels.everyWeeks(count);
  }
  if (intervalUnit === 'month') {
    return count === 1 ? labels.monthly : labels.everyMonths(count);
  }
  return count === 1 ? labels.yearly : labels.everyYears(count);
}

export function getDefaultCadenceOption(
  options: SubscriptionCadenceOption[]
): SubscriptionCadenceOption | null {
  if (options.length === 0) return null;
  return options.find(option => option.isDefault) ?? options[0];
}

/** @deprecated Use formatCadencePriceSuffix with a cadence option. */
export function formatBillingIntervalLabel(
  interval: SubscriptionCadenceUnit | 'quarter',
  locale: PublicBookingFlowLocale = 'en'
): string {
  const suffix = publicBookingUi(locale).subscriptions.cadenceSuffix;
  if (interval === 'week') return suffix.week;
  if (interval === 'month') return suffix.month;
  if (interval === 'quarter') return suffix.months(3);
  return suffix.year;
}
