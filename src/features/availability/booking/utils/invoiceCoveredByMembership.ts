import type { BookingInvoiceSnapshot } from '../server/buildInvoiceSnapshot';

export function invoiceCoveredByMembership(
  snapshot: Pick<BookingInvoiceSnapshot, 'coveredByMembership'>
): boolean {
  return snapshot.coveredByMembership === true;
}
