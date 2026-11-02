/** Long date labels for owner quote detail (Activity, etc.). */
export function formatQuoteDetailDateLong(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Date + time for sent/viewed timestamps on the Activity timeline. */
export function formatQuoteDetailDateTime(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const day = formatQuoteDetailDateLong(iso);
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${day} · ${time}`;
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
