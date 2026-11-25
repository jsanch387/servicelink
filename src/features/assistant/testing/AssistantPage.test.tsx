import { AssistantPage } from '@/features/assistant';
import {
  ASSISTANT_BETA_CHAT_TURN_LIMIT,
  ASSISTANT_BETA_TEXT_LIMIT,
} from '@/features/assistant/constants/assistantBetaLimits';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

beforeAll(() => {
  window.scrollTo = vi.fn();
});

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import {
  REBOOK_CHECKIN_AFTER_DAYS,
  REVIEW_FOLLOWUP_AFTER_DAYS,
  buildAssistantToday,
  type AssistantCustomerInput,
} from '../today/buildAssistantToday';

const sendMessageMock = vi.fn(async () => undefined);

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    sendMessage: sendMessageMock,
    status: 'ready',
    error: undefined,
    clearError: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

const usage = {
  yearMonth: '2026-10',
  sent: 0,
  limit: ASSISTANT_BETA_TEXT_LIMIT,
  remaining: ASSISTANT_BETA_TEXT_LIMIT,
};

const chatUsage = {
  yearMonth: '2026-10',
  used: 0,
  limit: ASSISTANT_BETA_CHAT_TURN_LIMIT,
  remaining: ASSISTANT_BETA_CHAT_TURN_LIMIT,
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
  actions: [
    {
      id: 'act-1',
      customerId: 'past-jane',
      customerName: 'Jane Doe',
      kind: 'sent',
      subject: 'review_followup',
      createdAt: '2026-10-19T18:00:00.000Z',
    },
    {
      id: 'act-2',
      customerId: 'past-sarah',
      customerName: 'Sarah Lee',
      kind: 'sent',
      subject: 'rebook_checkin',
      createdAt: '2026-10-18T16:00:00.000Z',
    },
    {
      id: 'act-3',
      customerId: 'past-luis',
      customerName: 'Luis Vega',
      kind: 'skipped',
      subject: 'review_followup',
      createdAt: '2026-10-17T14:00:00.000Z',
    },
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
    render(
      <AssistantPage today={today} usage={usage} chatUsage={chatUsage} isPro />
    );

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
    render(
      <AssistantPage today={today} usage={usage} chatUsage={chatUsage} isPro />
    );

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

  it('opens activity from the morning preview', async () => {
    const user = userEvent.setup();
    render(
      <AssistantPage today={today} usage={usage} chatUsage={chatUsage} isPro />
    );

    expect(screen.getByRole('heading', { name: 'Activity' })).toBeTruthy();
    expect(screen.getByText('Review follow-up sent')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('Check-in sent')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'View all' }));

    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
  });

  it('sends an ask suggestion through chat', async () => {
    sendMessageMock.mockClear();
    const user = userEvent.setup();
    render(
      <AssistantPage today={today} usage={usage} chatUsage={chatUsage} isPro />
    );

    await user.click(screen.getByRole('button', { name: /Ask anything/i }));

    expect(
      screen.getByText(
        'Ask about money, schedule, customers, follow-ups, or your menu.'
      )
    ).toBeTruthy();

    await user.click(
      screen.getByRole('button', { name: 'How much did I make last month?' })
    );

    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith({
        text: 'How much did I make last month?',
      });
    });
  });

  it('shows Pro teaser and locks prepare/chat for free shops', async () => {
    sendMessageMock.mockClear();
    const user = userEvent.setup();
    render(
      <AssistantPage
        today={today}
        usage={usage}
        chatUsage={chatUsage}
        isPro={false}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Assistant is included with Pro' })
    ).toBeTruthy();

    await user.click(
      screen.getByRole('button', {
        name: /These customers haven’t booked in a while.*Pro feature/i,
      })
    );

    expect(screen.getByText('Unlock Assistant with Pro')).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: 'Check in with customers' })
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Not now' }));

    await user.click(screen.getByRole('button', { name: /Ask anything/i }));

    expect(sendMessageMock).not.toHaveBeenCalled();
    expect(screen.getByText('Unlock Assistant with Pro')).toBeTruthy();
  });
});
