/**
 * Shared session line parsing for Complete sheet payloads.
 * A missing kind is a fee, so older saves that send only label and amount still work.
 */

import type {
  JobCompletedSessionFeeInput,
  SessionLineKind,
} from './jobCompletedTypes';

const MAX_LABEL_LENGTH = 120;
const MAX_AMOUNT_CENTS = 999999;

export function parseSessionFeesInput(
  raw: unknown
): JobCompletedSessionFeeInput[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;

  const lines: JobCompletedSessionFeeInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const label =
      typeof (item as { label?: unknown }).label === 'string'
        ? (item as { label: string }).label.trim()
        : '';
    const amountCents = (item as { amountCents?: unknown }).amountCents;
    const kindRaw = (item as { kind?: unknown }).kind;
    if (
      !label ||
      label.length > MAX_LABEL_LENGTH ||
      typeof amountCents !== 'number' ||
      !Number.isInteger(amountCents) ||
      amountCents <= 0 ||
      amountCents > MAX_AMOUNT_CENTS
    ) {
      return null;
    }

    let kind: SessionLineKind = 'fee';
    if (kindRaw !== undefined) {
      if (kindRaw !== 'fee' && kindRaw !== 'discount') return null;
      kind = kindRaw;
    }

    lines.push({ kind, label, amountCents });
  }
  return lines;
}
