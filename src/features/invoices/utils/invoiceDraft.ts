import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';

import type { InvoiceDraft, InvoiceLineDraft } from '../types';

const FIRST_LINE_ID = 'line-1';

export function createInvoiceLine(id: string): InvoiceLineDraft {
  return { id, description: '', quantity: '1', amount: '' };
}

export function createEmptyInvoiceDraft(): InvoiceDraft {
  return {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    dueDate: '',
    note: '',
    lines: [createInvoiceLine(FIRST_LINE_ID)],
  };
}

/** Dollars string from MoneyInput → cents. Empty or zero is not a charge. */
export function parseInvoiceAmountToCents(amount: string): number | null {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === '.') return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;

  return Math.round(value * 100);
}

/** Whole quantity. Empty or zero does not bill the line. */
export function parseInvoiceQuantity(quantity: string): number | null {
  const trimmed = quantity.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const value = parseInt(trimmed, 10);
  if (!Number.isFinite(value) || value < 1) return null;
  return value;
}

export function invoiceLineTotalCents(line: InvoiceLineDraft): number | null {
  const unitCents = parseInvoiceAmountToCents(line.amount);
  const quantity = parseInvoiceQuantity(line.quantity);
  if (unitCents === null || quantity === null) return null;
  return unitCents * quantity;
}

export function invoiceDraftTotalCents(lines: InvoiceLineDraft[]): number {
  return lines.reduce((sum, line) => {
    return sum + (invoiceLineTotalCents(line) ?? 0);
  }, 0);
}

export function formatInvoiceDueDate(iso: string): string {
  const trimmed = iso.trim();
  if (!trimmed) return 'No due date';

  const date = new Date(`${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'No due date';

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Dollar string for MoneyInput. `2550` → `25.50`, `18000` → `180`. */
export function centsToInvoiceAmountInput(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) return '';
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  if (remainder === 0) return String(dollars);
  return `${dollars}.${String(remainder).padStart(2, '0')}`;
}

export function invoiceDraftFromStored(input: {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  note: string | null;
  dueOn: string | null;
  lines: Array<{
    id: string;
    position: number;
    description: string;
    quantity: number;
    unitAmountCents: number;
  }>;
}): InvoiceDraft {
  const dueMatch = input.dueOn?.match(/^(\d{4}-\d{2}-\d{2})/);
  const lines = [...input.lines]
    .sort((a, b) => a.position - b.position)
    .map(line => ({
      id: line.id,
      description: line.description,
      quantity: String(line.quantity),
      amount: centsToInvoiceAmountInput(line.unitAmountCents),
    }));

  return {
    customerName: input.customerName,
    customerPhone: normalizeUsPhoneDigits(input.customerPhone ?? ''),
    customerEmail: input.customerEmail ?? '',
    dueDate: dueMatch?.[1] ?? '',
    note: input.note ?? '',
    lines: lines.length > 0 ? lines : [createInvoiceLine(FIRST_LINE_ID)],
  };
}

export function formatInvoiceCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
