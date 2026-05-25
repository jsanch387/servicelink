/** Local calendar day → `YYYY-MM-DD` for API / DB. */
export function maintenanceAnchorIsoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse stored anchor date; noon local avoids DST edge cases. */
export function maintenanceAnchorDateFromIso(iso: string): Date | null {
  const t = iso.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Earliest selectable maintenance anchor (today, local). */
export function maintenanceAnchorMinSelectableDate(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}
