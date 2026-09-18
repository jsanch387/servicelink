/** Completed jobs keep the person who ran them. */
export function canChangeBookingAssignee(status: string): boolean {
  return status.trim() !== 'completed';
}
