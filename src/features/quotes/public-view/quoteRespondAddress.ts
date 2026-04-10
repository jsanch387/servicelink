/**
 * Shared rules for approve-address validation (public UI + POST /api/quotes/respond).
 */

export type QuoteRespondStructuredAddress = {
  street: string;
  unit: string | null;
  city: string;
  state: string;
  zip: string;
};

export type QuoteRespondAddressErrors = Partial<
  Record<'street' | 'city' | 'state' | 'zip', string>
>;

export function validateStructuredQuoteRespondAddress(
  raw: unknown
): { ok: true; address: QuoteRespondStructuredAddress } | { ok: false } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false };
  }
  const o = raw as Record<string, unknown>;
  const street = typeof o.street === 'string' ? o.street.trim() : '';
  const unitRaw = typeof o.unit === 'string' ? o.unit.trim() : '';
  const city = typeof o.city === 'string' ? o.city.trim() : '';
  const state = typeof o.state === 'string' ? o.state.trim().toUpperCase() : '';
  const zip = typeof o.zip === 'string' ? o.zip.trim() : '';

  if (street.length < 5) return { ok: false };
  if (city.length < 2) return { ok: false };
  if (!/^[A-Z]{2}$/.test(state)) return { ok: false };
  if (!/^\d{5}(-\d{4})?$/.test(zip)) return { ok: false };

  return {
    ok: true,
    address: {
      street,
      unit: unitRaw.length > 0 ? unitRaw : null,
      city,
      state,
      zip,
    },
  };
}

export function formatQuoteAddressDisplayLine(
  address: QuoteRespondStructuredAddress
): string {
  const hasCityLine =
    address.city.trim().length > 0 ||
    address.state.trim().length > 0 ||
    address.zip.trim().length > 0;
  if (!hasCityLine) {
    const parts = [
      address.street,
      address.unit ? `Unit ${address.unit}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  }
  const parts = [
    address.street,
    address.unit ? `Unit ${address.unit}` : '',
    `${address.city}, ${address.state} ${address.zip}`.trim(),
  ].filter(Boolean);
  return parts.join(', ');
}

/**
 * Fills empty structured address columns on a quote row (e.g. repair when DB was partial).
 */
/** Values for `quotes` address columns + legacy `service_address` line. */
export function quoteTableColumnsFromServiceLocation(
  loc: QuoteRespondStructuredAddress | null
): {
  customer_street_address: string | null;
  customer_unit_apt: string | null;
  customer_city: string | null;
  customer_state: string | null;
  customer_zip: string | null;
  service_address: string | null;
} {
  if (!loc) {
    return {
      customer_street_address: null,
      customer_unit_apt: null,
      customer_city: null,
      customer_state: null,
      customer_zip: null,
      service_address: null,
    };
  }
  return {
    customer_street_address: loc.street.trim() || null,
    customer_unit_apt: loc.unit,
    customer_city: loc.city.trim() || null,
    customer_state: loc.state.trim() || null,
    customer_zip: loc.zip.trim() || null,
    service_address: formatQuoteAddressDisplayLine(loc),
  };
}

export function mergeQuoteRowWithRespondFallback(
  row: Record<string, unknown>,
  fallback: QuoteRespondStructuredAddress | null
): Record<string, unknown> {
  if (!fallback) {
    return row;
  }
  const next = { ...row };
  const setIfEmpty = (col: string, value: string | null) => {
    const cur = String((next[col] as string | null | undefined) ?? '').trim();
    if (cur.length > 0) {
      return;
    }
    if (value != null && value.trim().length > 0) {
      next[col] = value.trim();
    }
  };

  setIfEmpty('customer_street_address', fallback.street);
  if (fallback.unit != null) {
    const cur = String(
      (next.customer_unit_apt as string | null | undefined) ?? ''
    ).trim();
    if (!cur && fallback.unit.trim().length > 0) {
      next.customer_unit_apt = fallback.unit.trim();
    }
  }
  setIfEmpty('customer_city', fallback.city);
  setIfEmpty('customer_state', fallback.state);
  setIfEmpty('customer_zip', fallback.zip);
  return next;
}
