/**
 * No-op by default to avoid logging account identifiers in production logs.
 * Keep call sites so lightweight tracing can be re-enabled from one place later.
 */
export function logConnect(
  _message: string,
  _details?: Record<string, unknown>
): void {}
