import {
  FREE_BOOKINGS_LIMIT,
  FREE_MAX_SERVICES,
  TEAM_SEAT_LIMIT,
} from './types';

export type PricingComparisonCell =
  | { kind: 'included' }
  | { kind: 'excluded' }
  | { kind: 'text'; value: string };

export interface PricingComparisonRow {
  feature: string;
  free: PricingComparisonCell;
  pro: PricingComparisonCell;
  team: PricingComparisonCell;
}

function comparisonRow(
  feature: string,
  free: PricingComparisonCell,
  pro: PricingComparisonCell,
  team: PricingComparisonCell = pro
): PricingComparisonRow {
  return { feature, free, pro, team };
}

const included = { kind: 'included' } as const;
const excluded = { kind: 'excluded' } as const;

/** What an owner is choosing between on the public pricing page. */
export const PRICING_COMPARISON_ROWS: readonly PricingComparisonRow[] = [
  comparisonRow(
    'Booking page',
    { kind: 'text', value: 'Yours to keep' },
    { kind: 'text', value: 'Yours to keep' }
  ),
  comparisonRow('Calendar', included, included),
  comparisonRow(
    'Services',
    { kind: 'text', value: `Up to ${FREE_MAX_SERVICES}` },
    { kind: 'text', value: 'Unlimited' }
  ),
  comparisonRow(
    'Vehicle pricing',
    { kind: 'text', value: 'One price' },
    { kind: 'text', value: 'Multiple price options' }
  ),
  comparisonRow(
    'Appointments',
    { kind: 'text', value: `${FREE_BOOKINGS_LIMIT} to start` },
    { kind: 'text', value: 'Unlimited' }
  ),
  comparisonRow('Client list', included, included),
  comparisonRow(
    'SMS and email',
    { kind: 'text', value: `On those ${FREE_BOOKINGS_LIMIT}` },
    { kind: 'text', value: 'Unlimited' }
  ),
  comparisonRow('Payments, deposits, and Tap to Pay', excluded, included),
  comparisonRow('Invoices', excluded, included),
  comparisonRow('Quotes', excluded, included),
  comparisonRow('Subscriptions for repeat clients', excluded, included),
  comparisonRow('Run sales and promotions', excluded, included),
  comparisonRow(
    'People on the shop',
    { kind: 'text', value: 'Just you' },
    { kind: 'text', value: 'Just you' },
    { kind: 'text', value: `Up to ${TEAM_SEAT_LIMIT}` }
  ),
  comparisonRow('Assign work from the board', excluded, excluded, included),
];
