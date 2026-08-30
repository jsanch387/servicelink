import { getStripeConnectClient } from '@/libs/stripe';
import type Stripe from 'stripe';
import {
  mapBalanceTransactionKind,
  mapStripeBalanceTransaction,
} from '../transactions/mapStripeBalanceTransaction';
import {
  PAYMENTS_REVENUE_STRIPE_PAGE_CAP,
  PAYMENTS_REVENUE_STRIPE_PAGE_SIZE,
} from './constants';
import type { RevenueEvent } from './summarizeRevenue';

export type LoadStripeRevenueResult =
  | { ok: true; events: RevenueEvent[] }
  | { ok: false };

export async function loadStripeRevenuePayments(args: {
  stripeAccountId: string;
  fromIso: string;
  toIso: string;
}): Promise<LoadStripeRevenueResult> {
  const stripe = getStripeConnectClient(args.stripeAccountId);
  const gte = Math.floor(Date.parse(args.fromIso) / 1000);
  const lte = Math.floor(Date.parse(args.toIso) / 1000);
  if (!Number.isFinite(gte) || !Number.isFinite(lte) || gte > lte) {
    return { ok: true, events: [] };
  }

  const events: RevenueEvent[] = [];
  let startingAfter: string | undefined;
  try {
    for (let page = 0; page < PAYMENTS_REVENUE_STRIPE_PAGE_CAP; page += 1) {
      const list = await listBalanceTransactions(stripe, {
        gte,
        lte,
        startingAfter,
      });

      for (const txn of list.data) {
        const event = toRevenueEvent(txn);
        if (event) events.push(event);
      }

      if (!list.has_more || list.data.length === 0) break;
      const lastId = list.data[list.data.length - 1]?.id?.trim();
      if (!lastId) break;
      startingAfter = lastId;
    }
    return { ok: true, events };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Stripe list failed';
    console.error('[payments:revenue] stripe list failed', message);
    return { ok: false };
  }
}

async function listBalanceTransactions(
  stripe: ReturnType<typeof getStripeConnectClient>,
  args: { gte: number; lte: number; startingAfter?: string }
): Promise<Stripe.ApiList<Stripe.BalanceTransaction>> {
  const params: Stripe.BalanceTransactionListParams = {
    limit: PAYMENTS_REVENUE_STRIPE_PAGE_SIZE,
    created: { gte: args.gte, lte: args.lte },
    starting_after: args.startingAfter,
  };
  try {
    return await stripe.balanceTransactions.list({
      ...params,
      expand: ['data.source'],
    });
  } catch {
    return stripe.balanceTransactions.list(params);
  }
}

export function toRevenueEvent(
  txn: Stripe.BalanceTransaction
): RevenueEvent | null {
  const kind = mapBalanceTransactionKind(txn.type);
  if (kind == null || kind === 'payout') return null;
  const mapped = mapStripeBalanceTransaction(txn);
  if (!mapped) return null;
  return {
    createdAt: mapped.createdAt,
    amountCents: mapped.netCents,
    source: mapped.source,
  };
}
