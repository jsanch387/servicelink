/** Date input (YYYY-MM-DD) → start of UTC day */
export function dateInputToStartsAtIso(date: string): string {
  return new Date(`${date.trim()}T00:00:00.000Z`).toISOString();
}

/** Date input (YYYY-MM-DD) → end of UTC day */
export function dateInputToEndsAtIso(date: string): string {
  return new Date(`${date.trim()}T23:59:59.999Z`).toISOString();
}

export function parseDbTimestamp(
  value: string | null | undefined
): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseRequiredDbTimestamp(
  value: string | null | undefined
): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** DB timestamptz → HTML date input value (YYYY-MM-DD, UTC). */
export function toDateInputValue(
  value: Date | string | null | undefined
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
