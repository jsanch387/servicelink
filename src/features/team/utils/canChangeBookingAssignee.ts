/** Completed and cancelled jobs keep the person who was on them. */
export function canChangeBookingAssignee(status: string): boolean {
  const value = status.trim();
  return value !== 'completed' && value !== 'cancelled';
}
