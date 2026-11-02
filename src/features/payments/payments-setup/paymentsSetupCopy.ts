/** Page subtitle under “Payments” while Stripe is not connected. */
export const PAYMENTS_PAGE_DESCRIPTION_SETUP_PENDING =
  'Connect Stripe for deposits, full pay at booking, and checkout on your ServiceLink page.';

/** Page subtitle when a Connect account exists but setup is not finished. */
export const PAYMENTS_PAGE_DESCRIPTION_FINISH_SETUP =
  'Finish Stripe setup to turn on deposits and card checkout on your booking page.';

export const PAYMENTS_SETUP_HERO_TITLE = 'Set up payments';

export const PAYMENTS_SETUP_LEAD =
  'Set this up so customers can pay through ServiceLink.';

export const PAYMENTS_SETUP_FINISH_HERO_TITLE = 'Finish setting up payments';

export const PAYMENTS_SETUP_FINISH_LEAD =
  'Finish setup so customers can pay you.';

/** When Stripe flagged the account (e.g. outstanding requirements). */
export const PAYMENTS_SETUP_RESTRICTED_LEAD =
  "Stripe still needs something from your account before card payments can go live. Open Stripe to resolve what's outstanding, then return here.";

export const PAYMENTS_SETUP_CTA_CONNECT_STRIPE = 'Connect with Stripe';

/** Shown when a Connect account exists but onboarding is not finished yet. */
export const PAYMENTS_SETUP_CTA_CONTINUE_STRIPE = 'Continue Stripe setup';

/** What a shop can do once payments are set up. */
export const PAYMENTS_SETUP_BENEFITS = [
  {
    id: 'accept',
    text: 'Accept payments through ServiceLink.',
  },
  {
    id: 'booking',
    text: 'Take a deposit or full payment when customers book.',
  },
  {
    id: 'ways',
    text: 'Charge with Tap to Pay on iPhone, or send a payment link.',
  },
  {
    id: 'subscriptions',
    text: 'Set up subscriptions for repeat customers.',
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
