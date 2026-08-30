import type { PaymentsTransactionSource } from '../transactions/constants';

export const PAYMENTS_REVENUE_PERIODS = [
  'week',
  'month',
  'year',
  'all',
  'custom',
] as const;

export type PaymentsRevenuePeriod = (typeof PAYMENTS_REVENUE_PERIODS)[number];

export const PAYMENTS_REVENUE_PERIOD_LABELS: Record<
  PaymentsRevenuePeriod,
  string
> = {
  week: 'Week',
  month: 'Month',
  year: 'Year',
  all: 'All time',
  custom: 'Custom',
};

/** Custom ranges up to ~2 months stay daily so a Jul 15–Aug 15 pick is not 5 anonymous weeks. */
export const REVENUE_CUSTOM_DAILY_MAX_DAYS = 62;
export const REVENUE_CUSTOM_WEEKLY_MAX_DAYS = 180;

export const PAYMENTS_REVENUE_SOURCE_LABELS: Record<
  PaymentsTransactionSource,
  string
> = {
  tap_to_pay: 'Tap to pay',
  payment_link: 'Payment link',
  booking: 'Card',
  membership: 'Memberships',
  payout: 'Payout',
  cash: 'Cash',
  payment_app: 'Payment app',
  other: 'Other',
};

export const PAYMENTS_REVENUE_DEFAULT_TIME_ZONE = 'UTC';
/** Earliest day All time will load (Stripe + offline). */
export const PAYMENTS_REVENUE_ALL_TIME_FROM_YMD = '2020-01-01';
export const PAYMENTS_REVENUE_MAX_CUSTOM_DAYS = 731;
export const PAYMENTS_REVENUE_OFFLINE_ROW_CAP = 5000;
export const PAYMENTS_REVENUE_STRIPE_PAGE_SIZE = 100;
export const PAYMENTS_REVENUE_STRIPE_PAGE_CAP = 50;

export const PAYMENTS_REVENUE_LOAD_ERROR = "Couldn't load earnings. Try again.";

export const PAYMENTS_REVENUE_SIGN_IN_AGAIN = 'Sign in again to view earnings.';

export const PAYMENTS_REVENUE_RANGE_ERROR = 'Choose a valid date range.';
