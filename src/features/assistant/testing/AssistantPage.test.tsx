import { AssistantPage } from '@/features/assistant';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import {
  REBOOK_CHECKIN_AFTER_DAYS,
  REVIEW_FOLLOWUP_AFTER_DAYS,
  buildAssistantToday,
  type AssistantCustomerInput,
} from '../today/buildAssistantToday';

afterEach(() => {
  cleanup();
});

function person(
  id: string,
  fullName: string,
  days: number,
  hasReview: boolean
): AssistantCustomerInput {
  return {
    id,
    fullName,
    phone: '555',
    email: null,
    lastVisitDaysAgo: days,
    lastVisitBookingId: `${id}-booking`,
    hasUpcomingAppointment: false,
    hasReview,
  };
}

const today = buildAssistantToday({
  bookingUrl: 'https://myservicelink.app/shop/book',
  actions: [],
  now: new Date('2026-10-20T15:00:00.000Z'),
  customers: [
    person('jane', 'Jane Doe', 8, false),
    person('luis', 'Luis Vega', REVIEW_FOLLOWUP_AFTER_DAYS, false),
    person('priya', 'Priya Shah', 4, false),
    person('owen', 'Owen Hart', 5, false),
    person('sarah', 'Sarah Lee', REBOOK_CHECKIN_AFTER_DAYS + 5, true),
    person('marco', 'Marco Diaz', REBOOK_CHECKIN_AFTER_DAYS + 1, true),
    person('elena', 'Elena Cruz', REBOOK_CHECKIN_AFTER_DAYS + 2, true),
  ],
});

describe('Assistant sample day', () => {
  it('prepares Sarah’s booking message and marks it sent', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} />);

    expect(screen.getByRole('heading', { name: 'Assistant' })).toBeTruthy();
    expect(screen.getByText(/Jane hasn’t left a review yet/)).toBeTruthy();
    expect(screen.getByText(/Sarah hasn’t booked in/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Send to 3' }));

    expect(
      screen.getByRole('textbox', { name: 'Booking message for Sarah' })
    ).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Send to Sarah' }));

    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
  });

  it('returns to the morning list from the message screen', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} />);

    await user.click(screen.getByRole('button', { name: 'Send to 4' }));
    expect(
      screen.getByRole('textbox', { name: 'Review follow-up for Jane' })
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(screen.getByRole('button', { name: 'Send to 4' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send to 3' })).toBeTruthy();
    expect(
      screen.queryByRole('textbox', { name: 'Review follow-up for Jane' })
    ).toBeNull();
  });

  it('lets a morning note be skipped', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} />);

    await user.click(
      screen.getByRole('button', { name: 'Skip booking messages' })
    );

    expect(screen.getByText('Booking messages skipped')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Restart' })).toBeNull();
  });

  it('collapses and expands the assistant panel', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} />);

    await user.click(
      screen.getByRole('button', { name: 'Collapse assistant' })
    );

    expect(
      screen.getByRole('button', { name: 'Expand assistant' })
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Expand assistant' }));

    expect(
      screen.getByRole('button', { name: 'Collapse assistant' })
    ).toBeTruthy();
  });
});
