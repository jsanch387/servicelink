import { isValidEmail } from '@/features/auth';
import { normalizeUsPhoneDigits } from '@/lib/formatUsPhone';

import {
  parseInvoiceAmountToCents,
  parseInvoiceQuantity,
} from './invoiceDraft';

const NAME_MAX = 120;
const EMAIL_MAX = 254;
const NOTE_MAX = 500;
const DESCRIPTION_MAX = 200;
const LINE_MAX = 40;
const UNIT_CENTS_MAX = 10_000_000;

const LINE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ParsedInvoiceLine = {
  /** Existing line id when the draft is being updated. */
  id: string | null;
  position: number;
  description: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
};

export type ParsedInvoiceDraft = {
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  note: string | null;
  dueOn: string | null;
  subtotalCents: number;
  totalCents: number;
  lines: ParsedInvoiceLine[];
};

export type ParseSaveInvoiceDraftResult =
  | { ok: true; data: ParsedInvoiceDraft }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  if (value == null) return '';
  if (typeof value !== 'string') return null;
  return value;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Same as a draft, and the customer email is required so it can be sent. */
export function parseSendInvoiceDraft(
  body: unknown
): ParseSaveInvoiceDraftResult {
  const parsed = parseSaveInvoiceDraft(body);
  if (!parsed.ok) return parsed;
  if (!parsed.data.customerEmail) {
    return { ok: false, error: 'Add an email to send this invoice.' };
  }
  return parsed;
}

export function parseSaveInvoiceDraft(
  body: unknown
): ParseSaveInvoiceDraftResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'Could not read this invoice.' };
  }

  const customerNameRaw = readString(body.customerName);
  const customerEmailRaw = readString(body.customerEmail);
  const customerPhoneRaw = readString(body.customerPhone);
  const dueDateRaw = readString(body.dueDate);
  const noteRaw = readString(body.note);

  if (
    customerNameRaw === null ||
    customerEmailRaw === null ||
    customerPhoneRaw === null ||
    dueDateRaw === null ||
    noteRaw === null ||
    !Array.isArray(body.lines)
  ) {
    return { ok: false, error: 'Could not read this invoice.' };
  }

  const customerName = customerNameRaw.trim().replace(/\s+/g, ' ');
  if (!customerName) {
    return { ok: false, error: "Add the customer's name." };
  }
  if (customerName.length > NAME_MAX) {
    return {
      ok: false,
      error: 'Customer name must be 120 characters or fewer.',
    };
  }

  const email = customerEmailRaw.trim().toLowerCase();
  if (email.length > EMAIL_MAX || (email && !isValidEmail(email))) {
    return { ok: false, error: 'Enter a valid email.' };
  }

  const phoneDigits = normalizeUsPhoneDigits(customerPhoneRaw);
  if (customerPhoneRaw.trim() && phoneDigits.length !== 10) {
    return { ok: false, error: 'Enter a 10-digit phone number.' };
  }

  const dueDate = dueDateRaw.trim();
  if (dueDate && !isIsoDate(dueDate)) {
    return { ok: false, error: 'Choose a valid due date.' };
  }

  const note = noteRaw.trim();
  if (note.length > NOTE_MAX) {
    return { ok: false, error: 'Notes must be 500 characters or fewer.' };
  }

  if (body.lines.length > LINE_MAX) {
    return { ok: false, error: 'An invoice can have up to 40 services.' };
  }

  const lines: ParsedInvoiceLine[] = [];

  for (const line of body.lines) {
    if (!isRecord(line)) {
      return { ok: false, error: 'Could not read this invoice.' };
    }

    const descriptionRaw = readString(line.description);
    const amountRaw = readString(line.amount);
    const quantityRaw = readString(line.quantity);
    if (descriptionRaw === null || amountRaw === null || quantityRaw === null) {
      return { ok: false, error: 'Could not read this invoice.' };
    }

    const description = descriptionRaw.trim().replace(/\s+/g, ' ');
    const amount = amountRaw.trim();
    if (!description && !amount) continue;

    const unitAmountCents = parseInvoiceAmountToCents(amount);
    if (!description || unitAmountCents === null) {
      return {
        ok: false,
        error: 'Each service needs a description and a price.',
      };
    }
    if (description.length > DESCRIPTION_MAX) {
      return {
        ok: false,
        error: 'Service names must be 200 characters or fewer.',
      };
    }
    if (unitAmountCents > UNIT_CENTS_MAX) {
      return { ok: false, error: 'Enter a price of $100,000 or less.' };
    }

    const quantity = parseInvoiceQuantity(quantityRaw);
    if (quantity === null) {
      return {
        ok: false,
        error: 'Enter a quantity of at least 1 for each service.',
      };
    }

    const lineId =
      typeof line.id === 'string' && LINE_ID.test(line.id.trim())
        ? line.id.trim()
        : null;

    lines.push({
      id: lineId,
      position: lines.length,
      description,
      quantity,
      unitAmountCents,
      amountCents: quantity * unitAmountCents,
    });
  }

  if (lines.length === 0) {
    return { ok: false, error: 'Add at least one service.' };
  }

  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);

  return {
    ok: true,
    data: {
      customerName,
      customerEmail: email || null,
      customerPhone: phoneDigits || null,
      note: note || null,
      dueOn: dueDate || null,
      subtotalCents: totalCents,
      totalCents,
      lines,
    },
  };
}
