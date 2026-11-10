import { AvailabilityBookingPage } from '@/features/availability/booking/components/AvailabilityBookingPage';
import type { PublicBookingPaymentSettings } from '@/features/availability/booking/types';
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
  CustomerForm: ({
    id,
    step,
    onSubmit,
    showNotificationsConsent,
    agreedToNotifications,
    onAgreedToNotificationsChange,
  }: {
    id: string;
    step: 'contact' | 'vehicleNotes';
    onSubmit: () => void;
    showNotificationsConsent?: boolean;
    agreedToNotifications?: boolean;
    onAgreedToNotificationsChange?: (agreed: boolean) => void;
  }) => (
    <form
      id={id}
      onSubmit={e => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {step === 'contact' && showNotificationsConsent ? (
        <label>
          <input
            type="checkbox"
            checked={agreedToNotifications}
            onChange={e => onAgreedToNotificationsChange?.(e.target.checked)}
          />
          Text me appointment updates
        </label>
      ) : null}
    </form>
  ),
  isCustomerFormStepValid: () => true,
}));

const cardPaymentSettings: PublicBookingPaymentSettings = {
  paymentsEnabled: true,
  checkoutMode: 'in_app',
  depositsEnabled: true,
  depositType: 'fixed',
  depositValue: 2000,
  currency: 'usd',
  taxEnabled: false,
  taxRateBps: 0,
};

function renderBookingFlow(options?: {
  bookingFlowLocale?: 'en' | 'es';
  requireBookingApproval?: boolean;
  paymentSettings?: PublicBookingPaymentSettings | null;
}) {
  return render(
    <AvailabilityBookingPage
      businessName="Acme Auto"
      businessId="biz-1"
      businessSlug="acme-auto"
      requireBookingApproval={options?.requireBookingApproval}
      paymentSettings={options?.paymentSettings}
      serviceId="svc-1"
      serviceName="Detail"
      serviceDurationMinutes={120}
      servicePriceCents={15000}
      selectedPriceOptionLabel="SUV"
      weeklySchedule={DEFAULT_SCHEDULE}
      selectedAddOns={[]}
      exitCalendarFlowHref="/acme-auto/book/details?serviceId=svc-1"
      exitCalendarFlowLabel="Back to add-ons"
      bookingFlowLocale={options?.bookingFlowLocale ?? 'en'}
      serviceLocation={{
        mode: 'mobile_only',
        profileLocationLabel: 'Austin, TX',
        shopAddressLabel: null,
        shopStreet: '',
        shopUnit: '',
        city: '',
        state: '',
        zip: '',
        shopCity: '',
        shopState: '',
        shopZip: '',
        hasCompleteShopAddress: false,
      }}
    />
  );
}

/**
 * Schedule step now leads with a "Next available" quick-pick card; expand
 * the full calendar (mocked Pick date / Pick time buttons) to exercise the
 * manual date/time selection flow these tests cover.
 */
async function openFullCalendar(
  user: ReturnType<typeof userEvent.setup>,
  locale: 'en' | 'es' = 'en'
) {
  await user.click(
    screen.getByRole('button', {
      name: locale === 'es' ? /elegir otra hora/i : /choose a different time/i,
    })
  );
}

async function advanceDetailsToReview(
  user: ReturnType<typeof userEvent.setup>
) {
  // Contact + service address are collapsed into one screen, so only one
  // "Continue" click is needed before reaching the vehicle/notes screen.
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
  await user.click(screen.getByRole('button', { name: /review booking/i }));
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

    await openFullCalendar(user);
    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    // Step 2: only primary CTA at bottom; top back goes to schedule.
    expect(
      screen.getByRole('button', { name: /back to date & time/i })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /^continue$/i })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^back$/i })).toBeNull();

    await user.click(
      screen.getByRole('button', { name: /back to date & time/i })
    );
    expect(screen.getByRole('button', { name: /^continue$/i })).toBeTruthy();
  });

  it('keeps option in service block, not Date & time block, on review step', async () => {
    const user = userEvent.setup();
    renderBookingFlow();

    await openFullCalendar(user);
    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await advanceDetailsToReview(user);

    // Step 3 back behavior
    expect(
      screen.getByRole('button', { name: /back to details/i })
    ).toBeTruthy();

    // Variant appears in service block only once.
    expect(screen.getAllByText('SUV')).toHaveLength(1);
  });

  it('allows continuing from details when SMS consent is unchecked', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input.toString();
      if (u.includes('/api/public/bookings/blocked/')) {
        return {
          ok: true,
          json: async () => ({ success: true, blockedSlots: [] }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });

    const user = userEvent.setup();
    renderBookingFlow();

    await openFullCalendar(user);
    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const smsCheckbox = screen.getByRole('checkbox', {
      name: /text me appointment updates/i,
    }) as HTMLInputElement;
    expect(smsCheckbox.checked).toBe(true);
    await user.click(smsCheckbox);
    expect(smsCheckbox.checked).toBe(false);

    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(screen.queryByText(/please check the box/i)).toBeNull();

    await user.click(screen.getByRole('button', { name: /review booking/i }));
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));

    const postsToCreateBooking = () =>
      fetchMock.mock.calls.filter(
        args =>
          args[1]?.method === 'POST' &&
          typeof args[0] === 'string' &&
          args[0].includes('/api/public/bookings') &&
          !args[0].includes('/blocked/')
      );

    expect(postsToCreateBooking().length).toBeGreaterThan(0);
  });

  it('skips payment and requests the appointment from review', async () => {
    const user = userEvent.setup();
    renderBookingFlow({
      requireBookingApproval: true,
      paymentSettings: cardPaymentSettings,
    });

    await openFullCalendar(user);
    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /review booking/i }));

    expect(
      screen.queryByRole('button', { name: /continue to payment/i })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /request appointment/i })
    ).toBeTruthy();
    expect(
      screen.getByText(
        'This is a request. Acme Auto will approve it, then we’ll let you know.'
      )
    ).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /payment/i })).toBeNull();
    expect(screen.queryByLabelText(/promo code/i)).toBeNull();
  });

  it('asks to request the appointment when approval is required', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const u = typeof input === 'string' ? input : input.toString();
      if (u.includes('/api/public/bookings/blocked/')) {
        return {
          ok: true,
          json: async () => ({ success: true, blockedSlots: [] }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: { id: 'bk-1' } }),
      } as Response;
    });

    const user = userEvent.setup();
    renderBookingFlow({ requireBookingApproval: true });

    await openFullCalendar(user);
    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /review booking/i }));

    expect(
      screen.queryByRole('button', { name: /confirm booking/i })
    ).toBeNull();
    await user.click(
      screen.getByRole('button', { name: /request appointment/i })
    );

    expect(
      screen.queryByRole('button', { name: /continue to payment/i })
    ).toBeNull();
    expect(screen.getByRole('heading', { name: 'Request sent' })).toBeTruthy();
    expect(screen.getByText('Estimated total')).toBeTruthy();
    expect(screen.queryByText('Total')).toBeNull();
    expect(
      screen.getByText(
        'Your appointment request was sent to Acme Auto. No email was sent because no email address was provided.'
      )
    ).toBeTruthy();
  });
});

describe('AvailabilityBookingPage (Spanish locale)', () => {
  it('uses Spanish continue and back labels (mocked date/time pickers hide calendar title)', async () => {
    const user = userEvent.setup();
    renderBookingFlow({ bookingFlowLocale: 'es' });

    expect(screen.queryByRole('button', { name: /^continuar$/i })).toBeNull();

    await openFullCalendar(user, 'es');
    expect(screen.getByRole('button', { name: /^continuar$/i })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /pick date/i }));
    await user.click(screen.getByRole('button', { name: /pick time/i }));
    await user.click(screen.getByRole('button', { name: /^continuar$/i }));

    expect(
      screen.getByRole('button', { name: /volver a fecha y hora/i })
    ).toBeTruthy();
  });
});
