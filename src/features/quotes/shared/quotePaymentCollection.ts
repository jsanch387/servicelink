/** How the owner asked the customer to pay when the quote was sent. */
export type QuotePaymentCollection =
  | 'none'
  | 'deposit'
  | 'full'
  | 'customer_choice';

/** What the customer can tap on an open quote. `accept` books with no card. */
export type QuoteCustomerChoice =
  | 'accept'
  | 'deposit'
  | 'full'
  | 'pay_in_person';

export type QuotePaymentChoice = Exclude<QuoteCustomerChoice, 'accept'>;

/** Owner send form. `available` is false unless the shop is Pro and can charge. */
export type QuoteSendPaymentOffer = {
  available: boolean;
  depositsEnabled: boolean;
  depositType: 'fixed' | 'percent';
  /** Cents when fixed, whole percent when percent. */
  depositValue: number;
};

/** Stripe USD minimum. Matches booking checkout. */
export const QUOTE_CARD_MIN_CENTS = 50;

export function parseQuotePaymentCollection(
  raw: unknown
): QuotePaymentCollection | null {
  if (raw == null || raw === '') return 'none';
  if (
    raw === 'none' ||
    raw === 'deposit' ||
    raw === 'full' ||
    raw === 'customer_choice'
  ) {
    return raw;
  }
  return null;
}

export function parseQuotePaymentChoice(
  raw: unknown
): QuotePaymentChoice | null | undefined {
  if (raw == null || raw === '') return null;
  if (raw === 'deposit' || raw === 'full' || raw === 'pay_in_person') {
    return raw;
  }
  return undefined;
}

export function depositDueCents(
  totalCents: number,
  depositType: 'fixed' | 'percent' | null,
  depositValue: number | null
): number {
  const total = Math.max(0, Math.round(totalCents));
  if (!depositType || depositValue == null || !Number.isFinite(depositValue)) {
    return 0;
  }
  if (depositType === 'fixed') {
    return Math.min(total, Math.max(0, Math.round(depositValue)));
  }
  const percent = Math.min(100, Math.max(0, depositValue));
  return Math.min(total, Math.round((total * percent) / 100));
}

export function formatUsdFromCents(cents: number): string {
  const amount = Math.max(0, Math.round(cents)) / 100;
  const hasCents = Math.round(cents) % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(amount);
}

export type QuoteCustomerPayment = {
  choices: QuoteCustomerChoice[];
  depositCents: number;
  totalCents: number;
};

/**
 * Buttons for an open quote. When card gates are closed, the only action is
 * accept, even if the quote was sent with a payment rule.
 */
export function quoteCustomerPayment(input: {
  collection: QuotePaymentCollection;
  priceCents: number;
  depositType: 'fixed' | 'percent' | null;
  depositValue: number | null;
  gatesOpen: boolean;
}): QuoteCustomerPayment {
  const totalCents = Math.max(0, Math.round(input.priceCents));
  const depositCents = depositDueCents(
    totalCents,
    input.depositType,
    input.depositValue
  );
  const acceptOnly: QuoteCustomerPayment = {
    choices: ['accept'],
    depositCents,
    totalCents,
  };
  if (!input.gatesOpen || input.collection === 'none') return acceptOnly;

  const depositOk = depositCents >= QUOTE_CARD_MIN_CENTS;
  const fullOk = totalCents >= QUOTE_CARD_MIN_CENTS;

  if (input.collection === 'deposit') {
    return depositOk
      ? { choices: ['deposit'], depositCents, totalCents }
      : acceptOnly;
  }
  if (input.collection === 'full') {
    return fullOk
      ? { choices: ['full'], depositCents, totalCents }
      : acceptOnly;
  }

  const choices: QuoteCustomerChoice[] = [];
  if (depositOk) choices.push('deposit');
  if (fullOk && depositCents !== totalCents) choices.push('full');
  choices.push('pay_in_person');
  return { choices, depositCents, totalCents };
}

export function quotePayButtonLabel(
  choice: QuoteCustomerChoice,
  payment: Pick<QuoteCustomerPayment, 'depositCents' | 'totalCents'>
): string {
  if (choice === 'accept') return 'Accept quote';
  if (choice === 'pay_in_person') return 'Pay in person';
  if (choice === 'deposit') {
    const amount = formatUsdFromCents(payment.depositCents);
    return payment.depositCents >= payment.totalCents
      ? `Pay ${amount}`
      : `Pay ${amount} deposit`;
  }
  return `Pay ${formatUsdFromCents(payment.totalCents)}`;
}
