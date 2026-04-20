/**
 * Sanitize database/Supabase error messages before showing them to users.
 * Hides schema, table, column, RLS, and other technical details to avoid
 * leaking internal structure and to keep messages user-friendly.
 */

const TECHNICAL_PATTERNS = [
  /\b(relation|table|column|schema)\b/i,
  /\b(does not exist|not found)\b/i,
  /\bPGRST\b/,
  /\bRLS\b/,
  /\b(row level security|permission denied for)\b/i,
  /\b(foreign key|constraint|unique)\b/i,
  /\b(syntax error|invalid)\s+(in|at)\b/i,
  /"\w+\.\w+"/, // "schema.table" or "table.column"
];

/**
 * Returns a safe, user-facing error string. Use for any error that might
 * come from the database or Supabase client.
 *
 * @param rawMessage - The original error message (e.g. error.message)
 * @param fallback - Message to show when rawMessage is technical or missing
 */
export function sanitizeDbError(
  rawMessage: string | null | undefined,
  fallback: string
): string {
  const msg = (rawMessage ?? '').trim();
  if (!msg) return fallback;

  const looksTechnical = TECHNICAL_PATTERNS.some(re => re.test(msg));
  return looksTechnical ? fallback : msg;
}
