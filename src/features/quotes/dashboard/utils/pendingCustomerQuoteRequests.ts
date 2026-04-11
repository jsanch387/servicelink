import type { DashboardQuote } from '../types';

/**
 * Open quote requests: customer submitted from the public profile and the owner
 * has not yet moved them past `requested` (e.g. into draft / sent).
 */
export function isPendingCustomerQuoteRequest(quote: DashboardQuote): boolean {
  return quote.source === 'customer_requested' && quote.status === 'requested';
}

export function listPendingCustomerQuoteRequests(
  quotes: readonly DashboardQuote[]
): DashboardQuote[] {
  return quotes.filter(isPendingCustomerQuoteRequest);
}

export function countPendingCustomerQuoteRequests(
  quotes: readonly DashboardQuote[]
): number {
  return listPendingCustomerQuoteRequests(quotes).length;
}

/** Newest first by `createdAt` (ISO). */
export function listPendingCustomerQuoteRequestsNewestFirst(
  quotes: readonly DashboardQuote[]
): DashboardQuote[] {
  return [...listPendingCustomerQuoteRequests(quotes)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
