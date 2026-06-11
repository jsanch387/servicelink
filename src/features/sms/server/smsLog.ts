/**
 * Lightweight, single-line logs for SMS flows. One concise line per event, e.g.
 *
 *   [sms] sent type=on_the_way ref=booking-1
 *   [sms] send_failed type=reminder error=timeout ref=abc123
 *
 * Deliberately quiet: no JSON dumps, no PII (we log message `type`, not the body
 * or phone number). Levels map to `console.info | warn | error`.
 */

export type SmsLogLevel = 'info' | 'warn' | 'error';

export function logSms(
  correlationId: string | undefined,
  level: SmsLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  const parts = [`[sms] ${event}`];

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || value === null || value === '') continue;
      const text = typeof value === 'string' ? value : JSON.stringify(value);
      parts.push(`${key}=${text}`);
    }
  }

  if (correlationId) parts.push(`ref=${correlationId}`);

  const line = parts.join(' ');
  if (level === 'warn') console.warn(line);
  else if (level === 'error') console.error(line);
  else console.info(line);
}
