import { Calendar } from '@/components/shared';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateSelector } from '../components/DateSelector';
import { TimeSlotGrid } from '../components/TimeSlotGrid';

afterEach(() => {
  cleanup();
});

describe('public booking calendar behavior', () => {
  it('prevents navigating to a month before the minimum date', async () => {
    const user = userEvent.setup();
    const minDate = new Date(2030, 6, 20);

    render(<Calendar value={null} onChange={vi.fn()} minDate={minDate} />);

    const previousButton = screen.getByRole('button', {
      name: /previous month/i,
    }) as HTMLButtonElement;
    expect(previousButton.disabled).toBe(true);

    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(previousButton.disabled).toBe(false);

    await user.click(previousButton);
    expect(previousButton.disabled).toBe(true);
  });

  it('keeps the browsed month when selected value is a new Date for the same day', async () => {
    const user = userEvent.setup();
    const selected = new Date(2030, 6, 20);
    const { rerender } = render(
      <Calendar value={selected} onChange={vi.fn()} minDate={selected} />
    );

    expect(screen.getByText('July')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText('August')).toBeTruthy();

    // Parent re-render with a new Date instance for the same selected day.
    rerender(
      <Calendar
        value={new Date(2030, 6, 20)}
        onChange={vi.fn()}
        minDate={new Date(2030, 6, 20)}
      />
    );

    expect(screen.getByText('August')).toBeTruthy();
    expect(screen.queryByText('July')).toBeNull();
  });

  it('selects the first date with availability', async () => {
    const user = userEvent.setup();
    const onSelectDate = vi.fn();
    const onUserSelectDate = vi.fn();
    const tuesdayOnlySchedule = {
      ...DEFAULT_SCHEDULE,
      monday: { enabled: false, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '09:00', end: '17:00' },
      thursday: { enabled: false, start: '09:00', end: '17:00' },
      friday: { enabled: false, start: '09:00', end: '17:00' },
    };

    render(
      <DateSelector
        weeklySchedule={tuesdayOnlySchedule}
        serviceDurationMinutes={60}
        existingBookings={[]}
        timeOffBlocks={[]}
        selectedDate={null}
        onSelectDate={onSelectDate}
        onUserSelectDate={onUserSelectDate}
        minDate={new Date(2030, 6, 22)}
      />
    );

    await waitFor(() => expect(onSelectDate).toHaveBeenCalled());
    const selected = onSelectDate.mock.calls[0][0] as Date;
    expect(selected.getFullYear()).toBe(2030);
    expect(selected.getMonth()).toBe(6);
    expect(selected.getDate()).toBe(23);
    expect(onUserSelectDate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: '23' }));
    expect(onUserSelectDate).toHaveBeenCalledTimes(1);
  });

  it('selects the first available time for the chosen date', async () => {
    const onSelectTime = vi.fn();

    render(
      <TimeSlotGrid
        selectedDate={new Date(2030, 6, 22)}
        serviceDurationMinutes={60}
        weeklySchedule={DEFAULT_SCHEDULE}
        existingBookings={[]}
        timeOffBlocks={[]}
        selectedTime={null}
        onSelectTime={onSelectTime}
      />
    );

    await waitFor(() => expect(onSelectTime).toHaveBeenCalledWith('09:00'));
  });
});
