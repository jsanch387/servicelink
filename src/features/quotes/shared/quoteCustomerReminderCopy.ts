function firstName(customerName: string | null | undefined): string {
  return customerName?.trim().split(/\s+/)[0] ?? '';
}

function businessLabel(businessName: string | null | undefined): string {
  return businessName?.trim() ?? '';
}

/**
 * Soft customer nudge. Same sentence in email and SMS (SMS then appends the `/q/` URL).
 */
export function quoteCustomerReminderLead(
  customerName?: string | null,
  businessName?: string | null
): string {
  const first = firstName(customerName);
  const business = businessLabel(businessName);
  const hey = first ? `Hey ${first}, ` : '';
  if (business) {
    return `${hey}${business} still has your quote open if you want to take a look.`;
  }
  return first
    ? `${hey}your quote is still open if you want to take a look.`
    : 'Your quote is still open if you want to take a look.';
}

export function quoteCustomerReminderSmsDedupeKey(quoteId: string): string {
  return `${quoteId.trim()}:quote_reminder`;
}
