/**
 * Plan copy is a single `description` string (bullets included).
 */

/** Persist the owner textarea as-is (trim ends only). */
export function normalizePlanDescriptionForStorage(
  description: string
): string {
  return description.replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
}

/** Text for UI — same field as storage. */
export function planDescriptionForDisplay(description: string): string {
  return description.replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
}
