export interface PaymentsTransactionsCursor {
  beforeIso?: string;
  stripeAfter?: string;
}

const TXN_ID = /^txn_[A-Za-z0-9]+$/;

export function parsePaymentsTransactionsCursor(
  raw?: string
): PaymentsTransactionsCursor {
  if (!raw) return {};
  if (TXN_ID.test(raw)) {
    return { stripeAfter: raw };
  }

  const pipe = raw.indexOf('|');
  if (pipe === -1) return {};

  const beforeRaw = raw.slice(0, pipe).trim();
  const stripePart = raw.slice(pipe + 1).trim();
  const parsed = Date.parse(beforeRaw);

  return {
    beforeIso: Number.isNaN(parsed)
      ? undefined
      : new Date(parsed).toISOString(),
    stripeAfter: TXN_ID.test(stripePart) ? stripePart : undefined,
  };
}

export function isPaymentsTransactionsCursor(raw: string): boolean {
  const cursor = parsePaymentsTransactionsCursor(raw);
  return Boolean(cursor.beforeIso || cursor.stripeAfter);
}

export function buildPaymentsTransactionsCursor(args: {
  beforeIso: string;
  stripeAfter: string | null;
}): string {
  return `${args.beforeIso}|${args.stripeAfter ?? ''}`;
}
