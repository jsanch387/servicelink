/**
 * Invoices nav rollout (signed-in account emails).
 *
 * - OPEN_TO_ALL true: every shop sees Invoices (current production state).
 * - Non-empty + OPEN_TO_ALL false: only listed accounts see the nav and routes.
 * - Empty list + OPEN_TO_ALL false: Invoices is hidden for everyone.
 */
export const INVOICES_ROLLOUT_OWNER_EMAILS: readonly string[] = [];

/** Open Invoices to every account (ignores the email list). */
export const INVOICES_ROLLOUT_OPEN_TO_ALL = true;

export function isOwnerEmailAllowedForInvoicesRollout(
  email: string | null | undefined
): boolean {
  if (INVOICES_ROLLOUT_OPEN_TO_ALL) return true;
  if (INVOICES_ROLLOUT_OWNER_EMAILS.length === 0) return false;

  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return INVOICES_ROLLOUT_OWNER_EMAILS.some(
    entry => entry.toLowerCase() === normalized
  );
}
