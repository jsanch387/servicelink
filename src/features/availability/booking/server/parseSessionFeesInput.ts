/**
 * Shared session fee parsing for Complete sheet payloads.
 */

import type { JobCompletedSessionFeeInput } from './jobCompletedTypes';

export function parseSessionFeesInput(
  raw: unknown
): JobCompletedSessionFeeInput[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;

  const fees: JobCompletedSessionFeeInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const label =
      typeof (item as { label?: unknown }).label === 'string'
        ? (item as { label: string }).label.trim()
        : '';
    const amountCents = (item as { amountCents?: unknown }).amountCents;
    if (!label || !Number.isInteger(amountCents) || amountCents < 0) {
      return null;
    }
    fees.push({ label, amountCents });
  }
  return fees;
}
