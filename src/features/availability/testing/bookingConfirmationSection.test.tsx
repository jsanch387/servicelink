import { BookingConfirmationSection } from '@/features/availability/components/BookingConfirmationSection';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

describe('BookingConfirmationSection', () => {
  it('starts as auto-confirm and explains that customers are confirmed immediately', () => {
    render(<BookingConfirmationSection autoConfirm onToggle={vi.fn()} />);

    const toggle = screen.getByRole('switch', {
      name: 'Auto-confirm bookings',
    });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(
      screen.getByText(
        'Appointments are auto-confirmed when a customer finishes booking.'
      )
    ).toBeTruthy();
  });

  it('explains request approval when auto-confirm is off', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <BookingConfirmationSection autoConfirm={false} onToggle={onToggle} />
    );

    expect(
      screen.getByText(
        'Customers request an appointment. You must approve it before it’s confirmed.'
      )
    ).toBeTruthy();

    await user.click(
      screen.getByRole('switch', { name: 'Auto-confirm bookings' })
    );
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('does not change while bookings are turned off', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <BookingConfirmationSection autoConfirm disabled onToggle={onToggle} />
    );

    await user.click(
      screen.getByRole('switch', { name: 'Auto-confirm bookings' })
    );
    expect(onToggle).not.toHaveBeenCalled();
  });
});
