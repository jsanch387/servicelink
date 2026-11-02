/**
 * Temporary sales-tax settings card. Flip OPEN_TO_ALL when the prod test is done.
 *
 * - OPEN_TO_ALL true: every owner sees the card.
 * - OPEN_TO_ALL false: only the emails below see it.
 */
export const SALES_TAX_ROLLOUT_OWNER_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
];

/** Open the sales tax card to every owner (ignores the email list). */
export const SALES_TAX_ROLLOUT_OPEN_TO_ALL = false;

export function isOwnerEmailAllowedForSalesTax(
  email: string | null | undefined
): boolean {
  if (SALES_TAX_ROLLOUT_OPEN_TO_ALL) return true;

  const normalized = email?.trim().toLowerCase() ?? '';
  if (!normalized) return false;
  return SALES_TAX_ROLLOUT_OWNER_EMAILS.some(
    entry => entry.toLowerCase() === normalized
  );
}
