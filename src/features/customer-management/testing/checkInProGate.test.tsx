import { CheckInProTeaserModalBody } from '@/features/customer-management/components/CheckInProTeaserModalBody';
import { CustomerDetailPanel } from '@/features/customer-management/components/CustomerDetailPanel';
import type { CustomerRecord } from '@/features/customer-management/types';
import { ROUTES } from '@/constants/routes';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  window.scrollTo = vi.fn();
});

afterEach(() => cleanup());

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

/** Due customer: qualifies for Check-in row (`isCustomerNeedsAttention`). */
const dueCustomerFixture: CustomerRecord = {
  id: 'test-due-1',
  name: 'Due Customer',
  phone: '+15551234567',
  email: 'due@example.com',
  lastService: 'Full detail',
  lastVisitDate: '2025-01-01',
  lastVisitDaysAgo: 100,
  nextAppointmentDate: null,
  nextAppointmentDaysUntil: null,
  totalVisits: 2,
  totalSpent: 50000,
  maintenanceVisitsCompleted: 0,
  status: 'returning',
  note: '',
};

function renderDueDetailPanel(opts: {
  hasProCheckInAccess: boolean;
  onMessageCustomer?: (mode: 'message' | 'win_back') => void;
}) {
  const onMessageCustomer = opts.onMessageCustomer ?? vi.fn();
  render(
    <CustomerDetailPanel
      customer={dueCustomerFixture}
      hasProCheckInAccess={opts.hasProCheckInAccess}
      onClose={() => {}}
      onMessageCustomer={onMessageCustomer}
      onDeleteCustomer={() => {}}
      onSaveNote={async () => ({ ok: true })}
      isSavingNote={false}
      saveNoteError={null}
      onDismissSaveNoteError={() => {}}
      formatCurrency={cents => `$${(cents / 100).toFixed(2)}`}
    />
  );
  return { onMessageCustomer };
}

describe('CustomerDetailPanel Check-in Pro gate', () => {
  it('Pro: Check-in triggers SMS win_back flow', async () => {
    const user = userEvent.setup();
    const { onMessageCustomer } = renderDueDetailPanel({
      hasProCheckInAccess: true,
    });

    await user.click(
      screen.getByRole('button', { name: /check-in customer via sms/i })
    );

    expect(onMessageCustomer).toHaveBeenCalledTimes(1);
    expect(onMessageCustomer).toHaveBeenCalledWith('win_back');
  });

  it('Free: Check-in opens teaser — no SMS, upgrade CTA present', async () => {
    const user = userEvent.setup();
    const { onMessageCustomer } = renderDueDetailPanel({
      hasProCheckInAccess: false,
    });

    await user.click(
      screen.getByRole('button', { name: /check-in: pro feature/i })
    );

    expect(onMessageCustomer).not.toHaveBeenCalled();

    expect(
      screen.getByText(/want to save hours of manual texting/i)
    ).toBeTruthy();

    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade.getAttribute('href')).toBe(ROUTES.DASHBOARD.UPGRADE);
    expect(upgrade.querySelector('svg')).toBeTruthy();
  });
});

describe('CheckInProTeaserModalBody', () => {
  it('Upgrade to Pro is a link to the upgrade route with crown icon', () => {
    render(<CheckInProTeaserModalBody onClose={() => {}} />);
    const upgrade = screen.getByRole('link', { name: /upgrade to pro/i });
    expect(upgrade.getAttribute('href')).toBe(ROUTES.DASHBOARD.UPGRADE);
    expect(upgrade.querySelector('svg')).toBeTruthy();
  });
});
