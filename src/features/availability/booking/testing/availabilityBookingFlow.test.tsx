import { AvailabilityBookingPage } from '@/features/availability/booking/components/AvailabilityBookingPage';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const mockReplace = vi.fn();

const testBookSearchParams = new URLSearchParams(
  'serviceId=svc-1&skipDetails=1'
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/acme-auto/book',
  useSearchParams: () => testBookSearchParams,
}));

beforeAll(() => {
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockReplace.mockClear();
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

vi.mock('@/features/availability/booking/components/DateSelector', () => ({
  DateSelector: ({ onSelectDate }: { onSelectDate: (date: Date) => void }) => (
    <button type="button" onClick={() => onSelectDate(new Date('2026-03-01'))}>
      Pick date
    </button>
  ),
}));

vi.mock('@/features/availability/booking/components/TimeSlotGrid', () => ({
  TimeSlotGrid: ({
    onSelectTime,
  }: {
    onSelectTime: (time: string) => void;
  }) => (
    <button type="button" onClick={() => onSelectTime('09:00')}>
      Pick time
    </button>
  ),
}));

vi.mock('@/features/availability/booking/components/CustomerForm', () => ({
  CustomerForm: ({ id, onSubmit }: { id: string; onSubmit: () => void }) => (
    <form
      id={id}
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    />
  ),
  isCustomerFormValid: () => true,
}));

function renderBookingFlow() {
  return render(
    <AvailabilityBookingPage
      businessName="Acme Auto"
      businessId="biz-1"
      businessSlug="acme-auto"
      serviceId="svc-1"
      serviceName="Detail"
      serviceDurationMinutes={120}
      servicePriceCents={15000}
      selectedPriceOptionLabel="SUV"
      weeklySchedule={DEFAULT_SCHEDULE}
      selectedAddOns={[]}
      exitCalendarFlowHref="/acme-auto/book/details?serviceId=svc-1"
      exitCalendarFlowLabel="Back to add-ons"
    />
  );
}

describe('AvailabilityBookingPage flow navigation', () => {
  it('uses top back for step navigation and removes duplicate bottom Back button', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    // Step 1: top back exits calendar flow.
    const exitLink = screen.getByRole('link', { name: /back to add-ons/i });
    expect(exitLink.getAttribute('href')).toBe(
      '/acme-auto/book/details?serviceId=svc-1'
    );

    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    // Step 2: only primary CTA at bottom; top back goes to schedule.
    expect(
      screen.getByRole('button', { name: /back to date & time/i })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /review booking/i })
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^back$/i })).toBeNull();

    await user.click(
      screen.getByRole('button', { name: /back to date & time/i })
    );
    expect(screen.getByRole('button', { name: /^continue$/i })).toBeTruthy();
  });

  it('keeps option in service block, not Date & time block, on review step', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /review booking/i }));

    // Step 3 back behavior
    expect(
      screen.getByRole('button', { name: /back to details/i })
    ).toBeTruthy();

    // Variant appears in service block only once.
    expect(screen.getAllByText('SUV')).toHaveLength(1);
  });
});
