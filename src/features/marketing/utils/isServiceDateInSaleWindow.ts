import type { PublicActiveSale } from '../types/publicActiveSale';

/** `YYYY-MM-DD` in local calendar terms for booking `scheduledDate`. */
export function formatServiceDateYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateYmd(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** True when the appointment date falls within the sale window (inclusive). */
export function isServiceDateInSaleWindow(
  sale: Pick<PublicActiveSale, 'startsAt' | 'endsAt'>,
  serviceDateYmd: string
): boolean {
  const trimmed = serviceDateYmd.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;

  if (sale.startsAt && trimmed < toDateYmd(sale.startsAt)) {
    return false;
  }
  if (sale.endsAt && trimmed > toDateYmd(sale.endsAt)) {
    return false;
  }

  return true;
}
