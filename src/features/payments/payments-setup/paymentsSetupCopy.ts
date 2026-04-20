/** Page subtitle under “Payments” while Stripe is not connected. */
export const PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING =
  'Connect Stripe for deposits, full pay at booking, and checkout on your ServiceLink page.';

export const PAYMENTS_SETUP_HERO_TITLE = 'Set up payments';

export const PAYMENTS_SETUP_LEAD =
  'Connect Stripe to take deposits, offer full payment at booking, and keep charges in one place.';

export const PAYMENTS_SETUP_CTA_CONNECT_STRIPE = 'Connect with Stripe';

/** Shown when a Connect account exists but onboarding is not finished yet. */
export const PAYMENTS_SETUP_CTA_CONTINUE_STRIPE = 'Continue Stripe setup';

/** One short sentence each. */
export const PAYMENTS_SETUP_BENEFITS = [
  {
    id: 'deposits',
    text: 'Take deposits when customers book.',
  },
  {
    id: 'full',
    text: 'Let customers pay in full when they book, if you offer it.',
  },
  {
    id: 'benefit',
    text: 'Booking and payout stay on ServiceLink with less back-and-forth.',
  },
] as const;

/** Small label above the ghost dashboard preview. */
export const PAYMENTS_SETUP_TEASE_OVERLINE =
  "Here's a peek at your payments home once you're connected.";
