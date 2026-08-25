import { applyPaymentsTransactionDisplay } from './applyPaymentsTransactionDisplay';
import {
  OFFLINE_SESSION_PAYMENT_METHOD_LABELS,
  localBookingPaymentTransactionId,
  type OfflineSessionPaymentMethod,
  type PaymentsTransactionSource,
} from './constants';
import type { MappedPaymentsTransaction } from './mapStripeBalanceTransaction';
import { resolvePaymentsTransactionBookingTitle } from './resolvePaymentsTransactionBookingTitle';

export interface OfflineSessionPaymentRow {
  id: string;
  bookingId: string;
  method: OfflineSessionPaymentMethod;
  amountCents: number;
  currency: string;
  recordedAt: string;
  customerName: string | null;
  serviceName: string | null;
  jobDetails?: unknown;
}

export function mapOfflineSessionPayment(
  row: OfflineSessionPaymentRow
): MappedPaymentsTransaction | null {
  if (row.amountCents <= 0) return null;
  const recordedAt = row.recordedAt.trim();
  if (!recordedAt || Number.isNaN(Date.parse(recordedAt))) return null;

  const methodLabel = OFFLINE_SESSION_PAYMENT_METHOD_LABELS[row.method];
  const source: PaymentsTransactionSource = row.method;
  const customerName = row.customerName?.trim() || null;
  const resolved = resolvePaymentsTransactionBookingTitle({
    serviceName: row.serviceName,
    jobDetails: row.jobDetails,
  });
  const title = resolved.title || 'Payment';
  const subtitle = customerName
    ? `${customerName} · ${methodLabel}`
    : methodLabel;

  return applyPaymentsTransactionDisplay({
    id: localBookingPaymentTransactionId(row.id),
    kind: 'payment',
    status: 'available',
    amountCents: row.amountCents,
    netCents: row.amountCents,
    feeCents: 0,
    displayAmountCents: row.amountCents,
    currency: (row.currency || 'usd').toLowerCase(),
    createdAt: new Date(recordedAt).toISOString(),
    availableOn: new Date(recordedAt).toISOString(),
    title,
    subtitle,
    description: null,
    source,
    methodLabel,
    customerName,
    bookingId: row.bookingId,
    paymentRequestId: null,
    payoutArrivalAt: null,
    extraCount: resolved.extraCount,
    serviceName: resolved.serviceName,
    jobCount: resolved.jobCount,
    bankLast4: null,
    cardLast4: null,
    tone: 'in',
    amountLabel: '',
    statusLabel: '',
    dateLabel: '',
    feeLabel: null,
    refs: {
      bookingId: row.bookingId,
      customerName: customerName ?? undefined,
    },
  });
}
