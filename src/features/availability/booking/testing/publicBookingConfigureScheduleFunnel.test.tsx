/**
 * Client funnel: configure (price / add-ons) and calendar without full route churn.
 * Asserts props wiring that must stay correct for revenue (wrong counts → broken progress UX).
 */
import { PublicBookingConfigureScheduleFunnel } from '@/app/[business-slug]/book/PublicBookingConfigureScheduleFunnel';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import type {
  AddOnForBooking,
  PriceOptionForBooking,
  ServiceForBooking,
} from '@/features/services/api/getServiceWithAddOnsForBooking';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const bookFlowPropsLog: Record<string, unknown>[] = [];

vi.mock('@/app/[business-slug]/book/BookFlowSwitch', () => ({
  BookFlowSwitch: (props: Record<string, unknown>) => {
    bookFlowPropsLog.push(props);
    return <div data-testid="book-flow-switch" />;
  },
}));

vi.mock('@/features/services/booking-flow', async () => {
  const actual = await vi.importActual<
    typeof import('@/features/services/booking-flow')
  >('@/features/services/booking-flow');
  return {
    ...actual,
    ServiceDetailsScreen: () => <div data-testid="service-details" />,
  };
});

function service(over: Partial<ServiceForBooking> = {}): ServiceForBooking {
  return {
    id: 'svc-1',
    name: 'Full detail',
    description: null,
    priceCents: 12_000,
    durationMinutes: 120,
    priceOptionsEnabled: false,
    ...over,
  };
}

const addon: AddOnForBooking = {
  id: 'a1',
  name: 'Clay bar',
  priceCents: 2000,
  durationMinutes: 15,
};

const priceOpt: PriceOptionForBooking = {
  id: 'p1',
  label: 'SUV',
  priceCents: 15_000,
  durationMinutes: 150,
};

const bookFlowBase = {
  useAvailabilityBooking: true,
  showNotAcceptingBookings: false,
  businessName: 'Acme',
  businessId: 'biz-1',
  businessSlug: 'acme',
  serviceId: 'svc-1',
  serviceName: 'Full detail',
  serviceDurationMinutes: 120,
  servicePrice: 12_000,
  weeklySchedule: DEFAULT_SCHEDULE,
  timeOffBlocks: [],
  paymentSettings: null,
  isOwnerManualBooking: false,
  exitCalendarFlowHref: '/acme/book?serviceId=svc-1',
  exitCalendarFlowLabel: 'Back',
};

afterEach(() => {
  cleanup();
  bookFlowPropsLog.length = 0;
});

describe('PublicBookingConfigureScheduleFunnel', () => {
  it('shows configure first when URL has not passed the configure gate', () => {
    render(
      <PublicBookingConfigureScheduleFunnel
        businessSlug="acme"
        serviceId="svc-1"
        service={service({ priceOptionsEnabled: true })}
        addOns={[addon]}
        priceOptions={[priceOpt]}
        initialPhase="configure"
        isOwnerManualBooking={false}
        bookingFlowLocale="en"
        exitScheduleToConfigureHref="/acme/book?serviceId=svc-1"
        bookFlowProps={{
          ...bookFlowBase,
        }}
      />
    );
    expect(screen.getByTestId('service-details')).toBeTruthy();
    expect(screen.queryByTestId('book-flow-switch')).toBeNull();
  });

  it('lands on calendar when gate already passed and passes configurePhaseCount for price + add-ons', () => {
    render(
      <PublicBookingConfigureScheduleFunnel
        businessSlug="acme"
        serviceId="svc-1"
        service={service({ priceOptionsEnabled: true })}
        addOns={[addon]}
        priceOptions={[priceOpt]}
        initialPhase="schedule"
        isOwnerManualBooking={false}
        bookingFlowLocale="en"
        exitScheduleToConfigureHref="/acme/book?serviceId=svc-1"
        bookFlowProps={{
          ...bookFlowBase,
        }}
      />
    );
    expect(screen.getByTestId('book-flow-switch')).toBeTruthy();
    const props = bookFlowPropsLog.at(-1)!;
    expect(props.bookingFlowConfigurePhaseCount).toBe(2);
    expect(typeof props.onExitScheduleStep).toBe('function');
  });

  it('passes configurePhaseCount 1 for price options only (no add-ons)', () => {
    render(
      <PublicBookingConfigureScheduleFunnel
        businessSlug="acme"
        serviceId="svc-1"
        service={service({ priceOptionsEnabled: true })}
        addOns={[]}
        priceOptions={[priceOpt]}
        initialPhase="schedule"
        isOwnerManualBooking={false}
        bookingFlowLocale="en"
        exitScheduleToConfigureHref="/acme/book?serviceId=svc-1"
        bookFlowProps={{ ...bookFlowBase }}
      />
    );
    expect(bookFlowPropsLog.at(-1)!.bookingFlowConfigurePhaseCount).toBe(1);
  });

  it('passes configurePhaseCount 1 for add-ons only (no multi-price)', () => {
    render(
      <PublicBookingConfigureScheduleFunnel
        businessSlug="acme"
        serviceId="svc-1"
        service={service({ priceOptionsEnabled: false })}
        addOns={[addon]}
        priceOptions={[]}
        initialPhase="schedule"
        isOwnerManualBooking={false}
        bookingFlowLocale="en"
        exitScheduleToConfigureHref="/acme/book?serviceId=svc-1"
        bookFlowProps={{ ...bookFlowBase }}
      />
    );
    expect(bookFlowPropsLog.at(-1)!.bookingFlowConfigurePhaseCount).toBe(1);
  });

  it('passes configurePhaseCount 0 when neither price options nor add-ons', () => {
    render(
      <PublicBookingConfigureScheduleFunnel
        businessSlug="acme"
        serviceId="svc-1"
        service={service({ priceOptionsEnabled: false })}
        addOns={[]}
        priceOptions={[]}
        initialPhase="schedule"
        isOwnerManualBooking={false}
        bookingFlowLocale="en"
        exitScheduleToConfigureHref="/acme/book?serviceId=svc-1"
        bookFlowProps={{ ...bookFlowBase }}
      />
    );
    expect(bookFlowPropsLog.at(-1)!.bookingFlowConfigurePhaseCount).toBe(0);
  });
});
