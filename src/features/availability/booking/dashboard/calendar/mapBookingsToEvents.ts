import type { BookingAssigneeOption } from '@/features/team/types/bookingAssignee';
import { bookingListServiceTitle } from '../utils/bookingCardServiceTitle';
import { bookingAssigneeBoardLabel } from '../utils/bookingAssigneeBoardLabel';
import type { AvailabilityBookingDisplay } from '../types';
import { hhmmToMinutes } from './dateUtils';
import type { CalendarEvent } from './types';

const DEFAULT_DURATION_MIN = 60;

export function mapBookingsToCalendarEvents(
  bookings: AvailabilityBookingDisplay[],
  assigneeOptions: readonly BookingAssigneeOption[] = []
): CalendarEvent[] {
  return bookings.map(booking => {
    const startMin = hhmmToMinutes(booking.startTimeHHmm || '09:00');
    const duration = Math.max(
      30,
      booking.serviceDurationMinutes || DEFAULT_DURATION_MIN
    );
    return {
      id: booking.id,
      dateKey: booking.date,
      startMin,
      endMin: startMin + duration,
      title: booking.customerName.trim() || 'Customer',
      subtitle: bookingListServiceTitle(booking),
      status: booking.status,
      assigneeLabel: bookingAssigneeBoardLabel(
        booking.assignedUserId,
        assigneeOptions
      ),
      booking,
    };
  });
}
