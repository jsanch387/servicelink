import type { AvailabilityBookingDisplay } from '../types';

export type CalendarMode = 'list' | 'calendar';

export type CalendarRange = 'day' | 'week' | 'month';

export type CalendarEventKind = 'booking' | 'timeOff';

export type CalendarEvent = {
  id: string;
  dateKey: string;
  startMin: number;
  endMin: number;
  title: string;
  subtitle: string;
  status: AvailabilityBookingDisplay['status'];
  kind?: CalendarEventKind;
  assigneeLabel?: string | null;
  booking: AvailabilityBookingDisplay | null;
};

export type LaidOutCalendarEvent = CalendarEvent & {
  col: number;
  colCount: number;
};

export type StackedWeekEvent = CalendarEvent & {
  topPx: number;
  heightPx: number;
};
