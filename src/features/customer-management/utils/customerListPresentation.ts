/** Short list date. Year appears only when it is not the current year. */
export function formatCustomerListDate(
  isoDate: string,
  now: Date = new Date()
): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(
    'en-US',
    sameYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
  );
}

export function formatCustomerVisitAgo(days: number | null): string | null {
  if (days == null || !Number.isFinite(days)) return null;
  const whole = Math.max(0, Math.floor(days));
  if (whole === 0) return 'Today';
  if (whole === 1) return 'Yesterday';
  if (whole < 30) return `${whole} days ago`;

  const years = Math.floor(whole / 365);
  if (years >= 1) {
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }

  const months = Math.min(11, Math.floor(whole / 30));
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/**
 * Visit column. The header already says Visit.
 * A booking shows the date. A past visit stays in days for the first month, then months and years.
 */
export function customerListSchedule(
  input: {
    nextAppointmentDate: string | null;
    lastVisitDate: string | null;
    lastVisitDaysAgo: number | null;
  },
  now: Date = new Date()
): string | null {
  if (input.nextAppointmentDate) {
    return formatCustomerListDate(input.nextAppointmentDate, now);
  }

  if (input.lastVisitDate) {
    return (
      formatCustomerVisitAgo(input.lastVisitDaysAgo) ??
      formatCustomerListDate(input.lastVisitDate, now)
    );
  }

  return null;
}
