import { resolveTapToPayRouteAuth } from '@/features/availability/booking/server/resolveTapToPayRouteAuth';
import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { formatPaymentCents } from '@/features/payments/utils/formatPaymentMoney';
import { getStripeConnectClient } from '@/libs/stripe';
import { assertOwnerPaymentsTransactionsRateLimits } from '@/server/rateLimit/ownerPaymentsTransactionsRateLimit';
import type { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import {
  PAYMENTS_TRANSACTIONS_LOAD_ERROR,
  PAYMENTS_TRANSACTIONS_PRO_REQUIRED,
  PAYMENTS_TRANSACTIONS_RATE_LIMIT_ERROR,
  PAYMENTS_TRANSACTIONS_SIGN_IN_AGAIN,
} from './constants';
import { enrichPaymentsTransactions } from './enrichPaymentsTransactions';
import { loadOfflineSessionPayments } from './loadOfflineSessionPayments';
import { mapOfflineSessionPayment } from './mapOfflineSessionPayment';
import {
  mapStripeBalanceTransaction,
  type MappedPaymentsTransaction,
} from './mapStripeBalanceTransaction';
import { mergePaymentsTransactionPage } from './mergePaymentsTransactionItems';
import { parseListPaymentsTransactionsQuery } from './parseListPaymentsTransactionsQuery';
import { parsePaymentsTransactionsCursor } from './parseTransactionsCursor';
import { resolveMerchantTransactionsAccount } from './resolveMerchantTransactionsAccount';
import { sumStripeBalanceCents } from './sumStripeBalanceCents';

export type PublicPaymentsTransaction = Omit<
  MappedPaymentsTransaction,
  'refs' | 'cardLast4' | 'bankLast4' | 'description'
>;

export type ListOwnerPaymentsTransactionsResult =
  | {
      ok: true;
      currency: string;
      balance: {
        availableCents: number;
        pendingCents: number;
        currency: string;
        availableLabel: string;
        pendingLabel: string;
        availableCaption: string;
        pendingCaption: string;
      };
      items: PublicPaymentsTransaction[];
      hasMore: boolean;
      nextCursor: string | null;
    }
  | {
      ok: false;
      httpStatus: number;
      error: string;
      retryAfterSec?: number;
    };

export async function listOwnerPaymentsTransactions(
  request: NextRequest
): Promise<ListOwnerPaymentsTransactionsResult> {
  const auth = await resolveTapToPayRouteAuth(request);
  if (!auth.ok) {
    return {
      ok: false,
      httpStatus: auth.httpStatus,
      error:
        auth.httpStatus === 401
          ? PAYMENTS_TRANSACTIONS_SIGN_IN_AGAIN
          : auth.error,
    };
  }

  const hasPro = await getHasProAccessForPayments(auth.supabase, auth.user.id);
  if (!hasPro) {
    return {
      ok: false,
      httpStatus: 403,
      error: PAYMENTS_TRANSACTIONS_PRO_REQUIRED,
    };
  }

  const rate = await assertOwnerPaymentsTransactionsRateLimits(
    request,
    auth.user.id
  );
  if (!rate.ok) {
    return {
      ok: false,
      httpStatus: 429,
      error: PAYMENTS_TRANSACTIONS_RATE_LIMIT_ERROR,
      retryAfterSec: rate.retryAfterSec,
    };
  }

  const parsed = parseListPaymentsTransactionsQuery(
    request.nextUrl.searchParams
  );
  if (!parsed.ok) {
    return { ok: false, httpStatus: 400, error: parsed.error };
  }

  const cursor = parsePaymentsTransactionsCursor(parsed.query.startingAfter);
  const includeOffline =
    parsed.query.kind == null || parsed.query.kind === 'payment';

  const account = await resolveMerchantTransactionsAccount({
    supabase: auth.supabase,
    businessId: auth.business.id,
  });
  if (!account.ok && account.httpStatus !== 422) {
    return {
      ok: false,
      httpStatus: account.httpStatus,
      error: account.error,
    };
  }

  const stripeAccountId = account.ok ? account.stripeAccountId : null;
  const stripeLimit = parsed.query.limit;

  let stripeItems: MappedPaymentsTransaction[] = [];
  let stripeHasMore = false;
  let availableCents = 0;
  let pendingCents = 0;

  if (stripeAccountId) {
    const stripe = getStripeConnectClient(stripeAccountId);
    let beforeIso = cursor.beforeIso;
    if (cursor.stripeAfter && !beforeIso) {
      beforeIso = await createdAtForStripeTransaction(
        stripe,
        cursor.stripeAfter
      );
    }

    let list: Stripe.ApiList<Stripe.BalanceTransaction>;
    let balance: Stripe.Balance;
    try {
      [list, balance] = await Promise.all([
        listBalanceTransactions(stripe, {
          limit: stripeLimit,
          startingAfter: cursor.stripeAfter,
          type: parsed.query.kind === 'payout' ? 'payout' : undefined,
        }),
        stripe.balance.retrieve(),
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Stripe list failed';
      console.error('[payments:transactions] stripe list failed', message);
      return {
        ok: false,
        httpStatus: 502,
        error: PAYMENTS_TRANSACTIONS_LOAD_ERROR,
      };
    }

    stripeItems = list.data
      .map(mapStripeBalanceTransaction)
      .filter((item): item is MappedPaymentsTransaction => item != null)
      .filter(item =>
        parsed.query.kind ? item.kind === parsed.query.kind : true
      );
    stripeHasMore = Boolean(list.has_more);
    availableCents = sumStripeBalanceCents(balance.available, 'usd');
    pendingCents = sumStripeBalanceCents(balance.pending, 'usd');

    cursor.beforeIso = beforeIso ?? cursor.beforeIso;
  }

  let localItems: MappedPaymentsTransaction[] = [];
  let localHasMore = false;
  if (includeOffline) {
    const offline = await loadOfflineSessionPayments(auth.supabase, {
      businessId: auth.business.id,
      limit: parsed.query.limit,
      beforeIso: cursor.beforeIso,
    });
    if (!offline.ok) {
      return {
        ok: false,
        httpStatus: 502,
        error: PAYMENTS_TRANSACTIONS_LOAD_ERROR,
      };
    }
    localItems = offline.rows
      .map(mapOfflineSessionPayment)
      .filter((item): item is MappedPaymentsTransaction => item != null);
    localHasMore = offline.hasMore;
  }

  const enrichedStripe = await enrichPaymentsTransactions(
    auth.supabase,
    auth.business.id,
    stripeItems
  );
  const page = mergePaymentsTransactionPage({
    stripeItems: enrichedStripe,
    localItems,
    limit: parsed.query.limit,
    stripeHasMore,
    localHasMore,
    previousStripeAfter: cursor.stripeAfter,
  });

  return {
    ok: true,
    currency: 'usd',
    balance: {
      availableCents,
      pendingCents,
      currency: 'usd',
      availableLabel: formatPaymentCents(availableCents),
      pendingLabel: formatPaymentCents(pendingCents),
      availableCaption: 'Available',
      pendingCaption: 'On the way',
    },
    items: page.items.map(toPublicTransaction),
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

async function createdAtForStripeTransaction(
  stripe: Stripe,
  transactionId: string
): Promise<string | undefined> {
  try {
    const txn = await stripe.balanceTransactions.retrieve(transactionId);
    if (typeof txn.created !== 'number' || !Number.isFinite(txn.created)) {
      return undefined;
    }
    return new Date(txn.created * 1000).toISOString();
  } catch (e) {
    console.warn(
      '[payments:transactions] retrieve cursor txn failed',
      e instanceof Error ? e.message : e
    );
    return undefined;
  }
}

async function listBalanceTransactions(
  stripe: Stripe,
  args: {
    limit: number;
    startingAfter?: string;
    type?: Stripe.BalanceTransactionListParams['type'];
  }
): Promise<Stripe.ApiList<Stripe.BalanceTransaction>> {
  const params: Stripe.BalanceTransactionListParams = {
    limit: args.limit,
    starting_after: args.startingAfter,
    type: args.type,
  };
  try {
    return await stripe.balanceTransactions.list({
      ...params,
      expand: ['data.source'],
    });
  } catch (e) {
    console.warn(
      '[payments:transactions] expand source failed, listing without expand',
      e instanceof Error ? e.message : e
    );
    return stripe.balanceTransactions.list(params);
  }
}

function toPublicTransaction(
  item: MappedPaymentsTransaction
): PublicPaymentsTransaction {
  const {
    refs: _refs,
    cardLast4: _cardLast4,
    bankLast4: _bankLast4,
    description: _description,
    ...publicItem
  } = item;
  return publicItem;
}
