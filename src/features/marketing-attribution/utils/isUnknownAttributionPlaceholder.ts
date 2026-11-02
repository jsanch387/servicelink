type AttributionPlaceholderFields = {
  channel: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  gclid: string | null;
  landing_path: string | null;
  referrer: string | null;
};

function blank(value: string | null | undefined): boolean {
  return !value?.trim();
}

/**
 * Server fallback row: channel `unknown` and no campaign, click id, landing, or referrer.
 * The browser may replace this with real first-touch UTMs inside the 48h window.
 */
export function isUnknownAttributionPlaceholder(
  row: AttributionPlaceholderFields
): boolean {
  if ((row.channel ?? '').trim().toLowerCase() !== 'unknown') return false;
  return (
    blank(row.utm_source) &&
    blank(row.utm_medium) &&
    blank(row.utm_campaign) &&
    blank(row.utm_content) &&
    blank(row.utm_term) &&
    blank(row.fbclid) &&
    blank(row.gclid) &&
    blank(row.landing_path) &&
    blank(row.referrer)
  );
}
