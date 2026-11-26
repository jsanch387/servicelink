/**
 * Public list prices checked on each vendor’s own site on 26 Nov 2026.
 * If a number could not be verified on the official page, it is omitted.
 */
export const PRICES_AS_OF = 'November 2026';

export type CompetitorPriceRow = {
  id: string;
  name: string;
  /** USD monthly figure used in the bar chart. Omit if unverified. */
  monthlyUsd?: number;
  priceLabel: string;
  source: string;
};

export const VERIFIED_MONTHLY_PRICES: readonly CompetitorPriceRow[] = [
  {
    id: 'servicelink',
    name: 'ServiceLink Pro',
    monthlyUsd: 20,
    priceLabel: '$20/mo ($200/yr). Team $60/mo.',
    source: 'myservicelink.app/pricing',
  },
  {
    id: 'detail-connect',
    name: 'Detail Connect',
    monthlyUsd: 43,
    priceLabel: '$43/mo ($389/yr)',
    source: 'detailconnect.app and Terms of Service',
  },
  {
    id: 'jobber',
    name: 'Jobber Core',
    monthlyUsd: 49,
    priceLabel: '$49/mo, or $29/mo billed annually (1 user)',
    source: 'getjobber.com/pricing',
  },
  {
    id: 'square-plus',
    name: 'Square Plus',
    monthlyUsd: 49,
    priceLabel: 'Free $0/location. Plus $49. Premium $149.',
    source: 'squareup.com/us/en/appointments/pricing',
  },
  {
    id: 'urable',
    name: 'Urable Pro',
    monthlyUsd: 110,
    priceLabel: 'Express $70/mo. Pro $110/mo on yearly view (booking).',
    source: 'urable.com/pricing',
  },
  {
    id: 'mtx',
    name: 'Mobile Tech RX',
    monthlyUsd: 39,
    priceLabel: 'Getting Started $39/admin/mo + $15/extra user',
    source: 'mobiletechrx.com/plans',
  },
];

/** Housecall Pro’s official pricing page did not show a dollar amount on 26 Nov 2026. */
export const HOUSECALL_PRO_PRICE_NOTE =
  'Confirm current pricing on housecallpro.com/pricing — the public page did not list a dollar amount on 26 Nov 2026.';
