/** Long date labels for owner quote detail (Activity, etc.). */
export function formatQuoteDetailDateLong(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** `HH:mm` or `HH:mm:ss` → 12h label for scheduled time. */
export function formatQuoteDetailTime12(hhmm: string): string {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return m === 0
    ? `${h12} ${ampm}`
    : `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}
