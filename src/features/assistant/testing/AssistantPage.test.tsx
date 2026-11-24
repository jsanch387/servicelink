import { AssistantPage } from '@/features/assistant';
import { ASSISTANT_BETA_TEXT_LIMIT } from '@/features/assistant/constants/assistantBetaLimits';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  REBOOK_CHECKIN_AFTER_DAYS,
  REVIEW_FOLLOWUP_AFTER_DAYS,
  buildAssistantToday,
  type AssistantCustomerInput,
} from '../today/buildAssistantToday';

afterEach(() => {
  cleanup();
});

const usage = {
  yearMonth: '2026-10',
  sent: 0,
  limit: ASSISTANT_BETA_TEXT_LIMIT,
  remaining: ASSISTANT_BETA_TEXT_LIMIT,
};

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
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          recorded: 3,
          usage: {
            ...usage,
            sent: 3,
            remaining: ASSISTANT_BETA_TEXT_LIMIT - 3,
          },
          results: [
            { customerId: 'sarah', subject: 'rebook_checkin', ok: true },
            { customerId: 'marco', subject: 'rebook_checkin', ok: true },
            { customerId: 'elena', subject: 'rebook_checkin', ok: true },
          ],
        }),
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens check-ins and marks selected texts sent', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} usage={usage} />);

    expect(screen.getByRole('heading', { name: 'Assistant' })).toBeTruthy();
    await user.click(
      screen.getByRole('button', {
        name: /These customers haven’t booked in a while/,
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Check in with customers' })
    ).toBeTruthy();
    expect(screen.getByText('Message')).toBeTruthy();
    expect(screen.getByText('Sarah Lee')).toBeTruthy();
    expect(
      screen.getAllByRole('meter', { name: /of .* texts this month/ }).length
    ).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Send 3 texts' }));

    await waitFor(() => {
      expect(screen.getAllByText('Sent').length).toBeGreaterThan(0);
    });
  });

  it('returns to the morning list from the prepare screen', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} usage={usage} />);

    await user.click(
      screen.getByRole('button', {
        name: /These customers haven’t left a review/,
      })
    );
    expect(
      screen.getByRole('heading', { name: 'Ask for reviews' })
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Assistant' }));

    expect(
      screen.getByRole('button', {
        name: /These customers haven’t left a review/,
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: /These customers haven’t booked in a while/,
      })
    ).toBeTruthy();
  });

  it('opens handled activity from the morning list', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} usage={usage} />);

    await user.click(
      screen.getByRole('button', { name: /Handled for you this week/ })
    );

    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
  });

  it('fills the ask field from a suggestion', async () => {
    const user = userEvent.setup();
    render(<AssistantPage today={today} usage={usage} />);

    await user.click(
      screen.getByRole('button', { name: 'How much did I make last month?' })
    );

    expect(
      (
        screen.getByRole('textbox', {
          name: 'Ask about your business',
        }) as HTMLInputElement
      ).value
    ).toBe('How much did I make last month?');
  });
});
