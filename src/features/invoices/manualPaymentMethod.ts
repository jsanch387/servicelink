export const MANUAL_INVOICE_PAYMENT_METHODS = [
  'cash',
  'payment_app',
  'other',
] as const;

export type ManualInvoicePaymentMethod =
  (typeof MANUAL_INVOICE_PAYMENT_METHODS)[number];

export function isManualInvoicePaymentMethod(
  value: unknown
): value is ManualInvoicePaymentMethod {
  return (
    typeof value === 'string' &&
    (MANUAL_INVOICE_PAYMENT_METHODS as readonly string[]).includes(value)
  );
}
