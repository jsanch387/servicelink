import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { BookingsCalendar } from '../calendar/BookingsCalendar';
import { CalendarListView } from '../calendar/CalendarListView';
import { CalendarModeDock } from '../calendar/CalendarModeDock';
import { CalendarMonthView } from '../calendar/CalendarMonthView';
import { CalendarWeekView } from '../calendar/CalendarWeekView';
import { monthGridKeys, weekKeys } from '../calendar/dateUtils';
import type { CalendarEvent } from '../calendar/types';
import { localDateKey } from '../dayPlannerUtils';
import type { AvailabilityBookingDisplay } from '../types';

const booking: AvailabilityBookingDisplay = {
  id: 'bk-1',
  customerName: 'Sam Patel',
  customerPhone: '5550001111',
  customerEmail: 'sam@example.com',
  serviceName: 'Full Detail',
  serviceDurationMinutes: 90,
  servicePriceCents: 12000,
  addonDetails: [],
  jobs: [],
  date: localDateKey(new Date()),
  time: '2:00 PM',
  startTimeHHmm: '14:00',
  status: 'confirmed',
  address: {
    street: '1 Main',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
  },
  notes: '',
  createdAt: '2026-09-01T12:00:00.000Z',
};

function stubMatchMedia(value: (query: string) => MediaQueryList) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value,
  });
}

function defaultMatchMedia(query: string) {
  return {
    matches: query.includes('min-width: 640px'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

beforeAll(() => {
  stubMatchMedia(defaultMatchMedia);
});

afterEach(() => {
  cleanup();
});

describe('BookingsCalendar', () => {
  it('keeps list and calendar as separate layouts', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onModeChange = vi.fn();
    const { rerender } = render(
      <>
        <BookingsCalendar
          bookings={[booking]}
          onSelectBooking={onSelect}
          mode="calendar"
          onModeChange={onModeChange}
        />
        <CalendarModeDock value="calendar" onChange={onModeChange} />
      </>
    );

    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(onModeChange).toHaveBeenCalledWith('list');
    rerender(
      <>
        <BookingsCalendar
          bookings={[booking]}
          onSelectBooking={onSelect}
          mode="list"
          onModeChange={onModeChange}
        />
        <CalendarModeDock value="list" onChange={onModeChange} />
      </>
    );
    expect(
      screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(screen.queryByRole('tab', { name: 'Month' })).toBeNull();
    expect(screen.getByText('Sam Patel')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Calendar' }));
    expect(onModeChange).toHaveBeenCalledWith('calendar');
    rerender(
      <>
        <BookingsCalendar
          bookings={[booking]}
          onSelectBooking={onSelect}
          mode="calendar"
          onModeChange={onModeChange}
        />
        <CalendarModeDock value="calendar" onChange={onModeChange} />
      </>
    );

    await user.click(screen.getByRole('tab', { name: 'Month' }));
    expect(
      screen.getByRole('tab', { name: 'Month' }).getAttribute('aria-selected')
    ).toBe('true');
    expect(screen.getByText('Sam Patel')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Day' }));
    expect(
      screen.getByRole('tab', { name: 'Day' }).getAttribute('aria-selected')
    ).toBe('true');
  });

  it('does not refetch the list when the viewport width changes', () => {
    let wide = true;
    const listeners = new Set<() => void>();
    stubMatchMedia(query => ({
      get matches() {
        return query.includes('min-width: 640px') ? wide : false;
      },
      media: query,
      addEventListener: (_event: string, listener: () => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: () => void) => {
        listeners.delete(listener);
      },
    }));

    const onListActive = vi.fn();
    render(
      <BookingsCalendar
        bookings={[booking]}
        onSelectBooking={vi.fn()}
        mode="list"
        onListActive={onListActive}
      />
    );
    expect(onListActive).toHaveBeenCalledTimes(1);

    wide = false;
    listeners.forEach(listener => listener());
    expect(onListActive).toHaveBeenCalledTimes(1);
    stubMatchMedia(defaultMatchMedia);
  });

  it('opens a real booking from the day grid', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <BookingsCalendar bookings={[booking]} onSelectBooking={onSelect} />
    );

    await user.click(screen.getByRole('tab', { name: 'Day' }));
    expect(screen.queryByText('Alex Rivera')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Sam Patel/i }));
    expect(onSelect).toHaveBeenCalledWith(booking);
  });

  it('floats the list and calendar switcher', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CalendarModeDock value="calendar" onChange={onChange} />);

    await user.click(screen.getByRole('tab', { name: 'List' }));
    expect(onChange).toHaveBeenCalledWith('list');
  });
});

describe('CalendarListView', () => {
  it('asks the parent to fetch the next page', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    const event: CalendarEvent = {
      id: 'job-1',
      dateKey: '2026-09-14',
      startMin: 540,
      endMin: 600,
      title: 'Sam Patel',
      subtitle: 'Detail',
      status: 'confirmed',
      booking: { ...booking, date: '2026-09-14' },
    };

    render(
      <CalendarListView
        events={[event]}
        onSelectEvent={vi.fn()}
        hasMore
        onLoadMore={onLoadMore}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Sep 14' })).toBeTruthy();
    expect(screen.queryByText('Monday')).toBeNull();
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('uses the empty copy for the active filter', () => {
    render(
      <CalendarListView
        events={[]}
        onSelectEvent={vi.fn()}
        filter="cancelled"
      />
    );

    expect(screen.getByText('No cancelled bookings.')).toBeTruthy();
  });

  it('uses assigned-to-me empty copy', () => {
    render(
      <CalendarListView events={[]} onSelectEvent={vi.fn()} assignedToMe />
    );

    expect(screen.getByText('No appointments assigned to you.')).toBeTruthy();
  });
});

describe('CalendarWeekView', () => {
  it('shows three jobs then month-style +more text', async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    const names = ['Ada', 'Bea', 'Cam', 'Dee'];
    const events: CalendarEvent[] = names.map((title, index) => ({
      id: `job-${index}`,
      dateKey: '2026-09-16',
      startMin: 600,
      endMin: 660,
      title,
      subtitle: 'Detail',
      status: 'confirmed',
      booking: { ...booking, id: `bk-${index}`, customerName: title },
    }));

    render(
      <CalendarWeekView
        weekKeys={weekKeys('2026-09-16')}
        events={events}
        onSelectDay={onSelectDay}
        onSelectEvent={vi.fn()}
      />
    );

    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByText('Bea')).toBeTruthy();
    expect(screen.getByText('Cam')).toBeTruthy();
    expect(screen.queryByText('Dee')).toBeNull();
    expect(screen.queryByText('+2 more')).toBeNull();
    await user.click(screen.getByRole('button', { name: '+1 more' }));
    expect(onSelectDay).toHaveBeenCalledWith('2026-09-16');
  });
});

describe('CalendarMonthView', () => {
  it('hatches a time-off day and keeps booking chips on top', () => {
    render(
      <CalendarMonthView
        monthKey="2026-09-01"
        gridKeys={monthGridKeys('2026-09-16')}
        events={[
          {
            id: 'off-1',
            dateKey: '2026-09-16',
            startMin: 0,
            endMin: 1439,
            title: 'Shop closed',
            subtitle: 'Time off',
            status: 'confirmed',
            kind: 'timeOff',
            booking: null,
          },
          {
            id: 'job-1',
            dateKey: '2026-09-16',
            startMin: 840,
            endMin: 930,
            title: 'Sam Patel',
            subtitle: 'Full Detail',
            status: 'confirmed',
            booking,
          },
        ]}
        onSelectDay={vi.fn()}
        onSelectEvent={vi.fn()}
      />
    );

    expect(screen.queryByText('Shop closed')).toBeNull();
    expect(screen.getByText('Sam Patel')).toBeTruthy();
    const dayButton = screen.getByRole('button', {
      name: 'Open 2026-09-16, time off',
    });
    expect(dayButton.closest('[data-time-off="true"]')).toBeTruthy();
  });
});
