const PREFIX = '[payments:connect]';

/** Server-side trace logs for Stripe Connect onboard + DB sync (grep: `payments:connect`). */
export function logConnect(
  message: string,
  details?: Record<string, unknown>
): void {
  if (details && Object.keys(details).length > 0) {
    console.info(PREFIX, message, details);
  } else {
    console.info(PREFIX, message);
  }
}
