/** Page subtitle under “Payments” while Stripe is not connected. */
export const PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING =
  'Connect Stripe for deposits, full pay at booking, and checkout on your ServiceLink page.';

/** Page subtitle when a Connect account exists but setup is not finished. */
export const PAYMENTS_PAGE_DESCRIPTION_FINISH_SETUP =
  'Finish Stripe setup to turn on deposits and card checkout on your booking page.';

export const PAYMENTS_SETUP_HERO_TITLE = 'Set up payments';

export const PAYMENTS_SETUP_LEAD =
  'Connect Stripe to take deposits, offer full payment at booking, and keep charges in one place.';

export const PAYMENTS_SETUP_FINISH_HERO_TITLE = 'Finish setting up payments';

export const PAYMENTS_SETUP_FINISH_LEAD =
  'You started connecting Stripe — finish the remaining steps so you can take deposits and full payment at booking.';

/** When Stripe flagged the account (e.g. outstanding requirements). */
export const PAYMENTS_SETUP_RESTRICTED_LEAD =
  "Stripe still needs something from your account before card payments can go live. Open Stripe to resolve what's outstanding, then return here.";

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

/** Resume / incomplete Connect — action-oriented, not first-time sales copy. */
export const PAYMENTS_SETUP_FINISH_BENEFITS = [
  {
    id: 'stripe',
    text: 'Complete any verification or bank details Stripe asks for.',
  },
  {
    id: 'return',
    text: 'Come back here to turn on ServiceLink checkout.',
  },
  {
    id: 'live',
    text: 'Then accept deposits or full payment when customers book.',
  },
] as const;

/** Small label above the ghost dashboard preview. */
export const PAYMENTS_SETUP_TEASE_OVERLINE =
  "Here's a peek at your payments home once you're connected.";

export const PAYMENTS_SETUP_FINISH_TEASE_OVERLINE =
  "Your full payments dashboard appears once Stripe confirms you're ready to charge.";
