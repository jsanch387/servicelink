import { parseTapToPayConnectionTokenBody } from '@/features/availability/booking/server/parseTapToPayConnectionTokenBody';
import {
  parseCreatePaymentLinkBody,
  type CreatePaymentLinkRequestBody,
} from './parseCreatePaymentLinkBody';

export interface CreatePaymentTapToPayIntentRequestBody
  extends CreatePaymentLinkRequestBody {
  stripeAccountId?: string;
}

export type ParseCreatePaymentTapToPayIntentBodyResult =
  | { ok: true; body: CreatePaymentTapToPayIntentRequestBody }
  | { ok: false; error: string };

/**
 * Amount + note rules match payment links. Optional stripeAccountId is
 * validated later against payment_accounts.
 */
export function parseCreatePaymentTapToPayIntentBody(
  raw: unknown
): ParseCreatePaymentTapToPayIntentBodyResult {
  const parsed = parseCreatePaymentLinkBody(raw);
  if (!parsed.ok) {
    return parsed;
  }

  const account = parseTapToPayConnectionTokenBody(raw);
  if (!account.ok) {
    return account;
  }

  return {
    ok: true,
    body: {
      ...parsed.body,
      stripeAccountId: account.body.stripeAccountId,
    },
  };
}
