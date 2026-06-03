/**
 * Short stable headline for notifications (in-app + Expo push).
 * Mirrors ServiceLink mobile `notificationMinimalDisplayTitle` rules.
 *
 * @param type — `notifications.type`
 * @param referenceType — `notifications.reference_type`
 * @param fallbackTitle — trimmed DB `title` for the final else branch
 */

const TITLE_MAX = 52;

function truncateFallback(title: string): string {
  const t = title.trim();
  if (!t.length) return 'Update';
  if (t.length <= TITLE_MAX) return t;
  return `${t.slice(0, TITLE_MAX - 1)}…`;
}

export function notificationMinimalDisplayTitle(
  type: string,
  referenceType: string,
  fallbackTitle: string
): string {
  const blob = `${type} ${referenceType}`.toLowerCase();

  if (blob.includes('payment') && blob.includes('fail')) {
    return 'Payment failed';
  }

  const paymentTokens = [
    'payment',
    'payout',
    'deposit',
    'refund',
    'invoice',
  ] as const;
  if (paymentTokens.some(t => blob.includes(t))) {
    return 'New payment';
  }

  // Public “request a quote” flow (`notifications.type`); must run before
  // `blob.includes('quote')` because `quote_request` contains substring `quote`.
  if (blob.includes('quote_request')) {
    return 'New quote request';
  }

  if (blob.includes('quote')) {
    if (blob.includes('accept')) return 'Quote accepted';
    if (blob.includes('decline') || blob.includes('reject')) {
      return 'Quote declined';
    }
    if (blob.includes('expire')) return 'Quote expired';
    return 'New quote';
  }

  if (blob.includes('review')) {
    return 'New review';
  }

  if (blob.includes('cancel')) return 'Appointment canceled';
  if (blob.includes('reschedule') || blob.includes('rescheduled')) {
    return 'Appointment updated';
  }
  if (blob.includes('reminder')) return 'Upcoming appointment';
  if (blob.includes('booking') || blob.includes('appointment')) {
    return 'New appointment';
  }
  if (blob.includes('customer')) return 'Customer update';
  if (blob.includes('subscription') || blob.includes('billing')) {
    return 'Billing update';
  }

  return truncateFallback(fallbackTitle);
}

/** Second line for booking/quote style alerts (matches mobile inbox). */
export function notificationInboxSubtitleFromCustomer(
  customerName: string | null | undefined
): string | null {
  const name = customerName?.trim();
  if (!name) return null;
  return `From ${name}`;
}
