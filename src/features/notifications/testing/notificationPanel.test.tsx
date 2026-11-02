import { NotificationPanel } from '@/features/notifications/components/NotificationPanel';
import type { NotificationDisplay } from '@/features/notifications/types/notification';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
});

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

function notification(
  overrides: Partial<NotificationDisplay>
): NotificationDisplay {
  return {
    id: 'n1',
    type: 'availability_booking',
    title: 'New appointment',
    body: 'From Jane',
    referenceId: 'b1',
    readAt: null,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ...overrides,
  };
}

const panelProps = {
  unreadCount: 1,
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  onFilterChange: vi.fn(),
  onMarkAsRead: vi.fn(),
  onMarkAllAsRead: vi.fn(),
  onLoadMore: vi.fn(),
  onClose: vi.fn(),
};

describe('NotificationPanel', () => {
  it('shows New items and can switch to Recent', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onLoadMore = vi.fn();
    const onClose = vi.fn();

    render(
      <NotificationPanel
        {...panelProps}
        filter="new"
        notifications={[
          notification({ id: 'unread-1', title: 'New appointment' }),
        ]}
        onFilterChange={onFilterChange}
        onLoadMore={onLoadMore}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('tab', { name: 'New' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Recent' })).toBeTruthy();
    expect(screen.getByText('New appointment')).toBeTruthy();
    expect(screen.getByRole('button', { name: /mark all read/i })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: 'Recent' }));
    expect(onFilterChange).toHaveBeenCalledWith('recent');

    await user.click(screen.getByRole('button', { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole('button', { name: /close notifications/i })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an empty state when New has no notifications', () => {
    render(
      <NotificationPanel
        {...panelProps}
        filter="new"
        notifications={[]}
        unreadCount={0}
        hasMore={false}
        onMarkAllAsRead={vi.fn()}
      />
    );

    expect(screen.getByText("You're all caught up")).toBeTruthy();
    expect(screen.queryByRole('button', { name: /load more/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /mark all read/i })).toBeNull();
  });

  it('shows Recent history empty state', () => {
    render(
      <NotificationPanel
        {...panelProps}
        filter="recent"
        notifications={[]}
        unreadCount={0}
        hasMore={false}
      />
    );

    expect(screen.getByText('No recent notifications')).toBeTruthy();
  });
});
