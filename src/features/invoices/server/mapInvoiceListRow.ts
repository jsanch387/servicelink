import type { InvoiceListItem, InvoiceStatus } from '../types';

const STATUSES: readonly InvoiceStatus[] = ['draft', 'sent', 'paid', 'void'];

function isStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && STATUSES.includes(value as InvoiceStatus);
}

export function mapInvoiceListRow(row: {
  id: unknown;
  status: unknown;
  customer_name: unknown;
  total_cents: unknown;
  due_on: unknown;
  created_at: unknown;
  invoice_number: unknown;
}): InvoiceListItem | null {
  if (typeof row.id !== 'string' || !isStatus(row.status)) return null;
  if (typeof row.customer_name !== 'string') return null;
  if (typeof row.created_at !== 'string') return null;

  const totalCents = Number(row.total_cents);
  if (!Number.isInteger(totalCents) || totalCents < 0) return null;

  const dueOn =
    row.due_on == null
      ? null
      : typeof row.due_on === 'string'
        ? row.due_on
        : null;
  if (row.due_on != null && dueOn === null) return null;

  const invoiceNumber =
    row.invoice_number == null
      ? null
      : typeof row.invoice_number === 'number'
        ? row.invoice_number
        : null;
  if (row.invoice_number != null && invoiceNumber === null) return null;

  return {
    id: row.id,
    status: row.status,
    customerName: row.customer_name,
    totalCents,
    dueOn,
    createdAt: row.created_at,
    invoiceNumber,
  };
}
