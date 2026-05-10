/**
 * Small structured logs for API / server flows (JSON payload + scope).
 * Avoid raw PII; pair with redaction helpers where needed.
 */

export type StructuredLogLevel = 'info' | 'warn' | 'error';

export function structuredLog(
  scope: string,
  requestId: string | undefined,
  level: StructuredLogLevel,
  event: string,
  meta?: Record<string, unknown>
): void {
  const payload = JSON.stringify({
    scope,
    requestId: requestId ?? null,
    event,
    ...meta,
  });
  const line = `${scope} ${event}`;
  if (level === 'info') console.info(line, payload);
  else if (level === 'warn') console.warn(line, payload);
  else console.error(line, payload);
}

/**
 * Supabase / PostgREST errors: log **code** always; **message** only outside
 * production (messages can echo row data or SQL fragments).
 */
export function supabaseErrorForLogs(
  error: { code?: string; message?: string } | null | undefined
): Record<string, unknown> {
  if (!error) return {};
  const meta: Record<string, unknown> = {};
  if (error.code) meta.supabaseCode = error.code;
  if (process.env.NODE_ENV !== 'production' && error.message?.trim()) {
    meta.supabaseMessageDev = error.message.trim().slice(0, 200);
  }
  return meta;
}
