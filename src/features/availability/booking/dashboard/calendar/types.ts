import type { AvailabilityBookingDisplay } from '../types';

export type CalendarMode = 'list' | 'calendar';

/** Matches list cards so the view/filter chrome sits on the same edges. */
export const CALENDAR_LIST_COLUMN_CLASS = 'mx-auto w-full max-w-3xl';

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
