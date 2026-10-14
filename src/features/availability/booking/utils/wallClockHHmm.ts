/** Normalizes `H:mm`, `HH:mm`, or `HH:mm:ss` to zero-padded `HH:mm`. */
export function wallClockHHmm(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value.trim().slice(0, 5);
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
