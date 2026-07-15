/**
 * Snapshot shape for `quotes.addon_details` (mirrors bookings `addon_details`).
 */

export type QuoteAddonDetail = {
  id: string;
  name: string;
  priceCents: number;
  durationMinutes?: number | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function normalizeQuoteAddonDetails(
  raw: unknown
): QuoteAddonDetail[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  if (raw.length === 0) return null;

  const out: QuoteAddonDetail[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const priceCents =
      typeof o.priceCents === 'number'
        ? o.priceCents
        : typeof o.price_cents === 'number'
          ? o.price_cents
          : NaN;
    if (!id || !name || !Number.isFinite(priceCents) || priceCents < 0) {
      continue;
    }
    const durationRaw = o.durationMinutes ?? o.duration_minutes ?? undefined;
    const durationMinutes =
      typeof durationRaw === 'number' &&
      Number.isFinite(durationRaw) &&
      durationRaw > 0
        ? durationRaw
        : null;
    out.push({
      id,
      name,
      priceCents: Math.round(priceCents),
      durationMinutes,
    });
  }
  return out.length > 0 ? out : null;
}

/** Split stored `Name — Option` into title + option for display. */
export function splitQuoteServiceDisplayName(serviceName: string): {
  title: string;
  optionLabel: string | null;
} {
  const trimmed = serviceName.trim();
  if (!trimmed) return { title: 'Service', optionLabel: null };
  const sep = ' — ';
  const idx = trimmed.indexOf(sep);
  if (idx <= 0) return { title: trimmed, optionLabel: null };
  const title = trimmed.slice(0, idx).trim();
  const optionLabel = trimmed.slice(idx + sep.length).trim();
  if (!title || !optionLabel) return { title: trimmed, optionLabel: null };
  return { title, optionLabel };
}
