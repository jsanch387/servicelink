import {
  FREE_BOOKINGS_LIMIT,
  FREE_MAX_PORTFOLIO_IMAGES,
  FREE_MAX_SERVICES,
  PRO_MAX_PORTFOLIO_IMAGES,
} from './types';

export type PricingComparisonCell =
  | { kind: 'included' }
  | { kind: 'excluded' }
  | { kind: 'text'; value: string };

export interface PricingComparisonRow {
  feature: string;
  free: PricingComparisonCell;
  pro: PricingComparisonCell;
}

/** Free vs Pro rows for public pricing comparison table. */
export const PRICING_COMPARISON_ROWS: readonly PricingComparisonRow[] = [
  {
    feature: 'Online bookings',
    free: { kind: 'text', value: `${FREE_BOOKINGS_LIMIT} lifetime` },
    pro: { kind: 'text', value: 'Unlimited' },
  },
  {
    feature: 'Booking page & scheduling',
    free: { kind: 'included' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Services on your profile',
    free: { kind: 'text', value: `Up to ${FREE_MAX_SERVICES}` },
    pro: { kind: 'text', value: 'Unlimited' },
  },
  {
    feature: 'Client CRM & visit history',
    free: { kind: 'included' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Email booking notifications',
    free: { kind: 'included' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Work gallery images',
    free: { kind: 'text', value: `Up to ${FREE_MAX_PORTFOLIO_IMAGES}` },
    pro: { kind: 'text', value: `Up to ${PRO_MAX_PORTFOLIO_IMAGES}` },
  },
  {
    feature: 'Verified profile badge',
    free: { kind: 'excluded' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Deposits before booking',
    free: { kind: 'text', value: 'None' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Take payments in-app',
    free: { kind: 'excluded' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Tap to Pay on iPhone',
    free: { kind: 'excluded' },
    pro: { kind: 'text', value: 'On your iPhone' },
  },
  {
    feature: 'Quote requests on your booking link',
    free: { kind: 'excluded' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Multiple prices per service',
    free: { kind: 'excluded' },
    pro: { kind: 'included' },
  },
  {
    feature: 'Priority support',
    free: { kind: 'excluded' },
    pro: { kind: 'included' },
  },
];
