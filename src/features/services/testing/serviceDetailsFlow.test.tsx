import { ServiceDetailsScreen } from '@/features/services/booking-flow/ServiceDetailsScreen';
import { loadPublicBookingJobsCart } from '@/features/availability/booking/utils/publicBookingJobsCart';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockRouterPush = vi.fn();

vi.mock('@/features/services/utils/serviceImageUrl', () => ({
  getServiceImageUrl: () => null,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, replace: vi.fn() }),
}));

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

vi.mock('@/components/shared', () => ({
  ImageWithFallback: () => <div data-testid="service-image" />,
  Button: ({
    children,
    href,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    disabled?: boolean;
  }) =>
    href ? (
      <a
        href={href}
        onClick={event => {
          event.preventDefault();
          onClick?.();
        }}
      >
        {children}
      </a>
    ) : (
      <button type="button" onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
  publicFlowBackNavClassName: 'mock-back-nav',
  PublicFlowStickyBackHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-flow-sticky-back-header">{children}</div>
  ),
  PublicFlowBackNavLabel: ({ label }: { label: string }) => (
    <span>{label}</span>
  ),
}));

vi.mock(
  '@/features/availability/booking/components/BookCalendarLoadingSkeleton',
  () => ({
    BookCalendarLoadingSkeleton: () => <div>calendar loading</div>,
  })
);

vi.mock('@/features/services/booking-flow/PriceOptionSelector', () => ({
  PriceOptionSelector: ({
    options,
    onSelect,
  }: {
    options: Array<{ id: string; label: string }>;
    onSelect: (id: string) => void;
  }) => (
    <div>
      {options.map(o => (
        <button key={o.id} type="button" onClick={() => onSelect(o.id)}>
          Pick {o.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/features/services/booking-flow/AddOnSelector', () => ({
  AddOnSelector: ({
    addOns,
    onToggle,
  }: {
    addOns: Array<{ id: string; name: string }>;
    onToggle: (id: string) => void;
  }) => (
    <div>
      {addOns.map(a => (
        <button key={a.id} type="button" onClick={() => onToggle(a.id)}>
          Toggle {a.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock(
  '@/features/services/booking-flow/ServiceDetailsBookingSummary',
  () => ({
    ServiceDetailsBookingSummary: () => <div>summary</div>,
  })
);

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  mockRouterPush.mockClear();
});

const baseService = {
  id: 'svc-1',
  name: 'Detail',
  description: 'Full detail',
  priceCents: 10000,
  durationMinutes: 120,
  priceOptionsEnabled: true,
};

const priceOptions = [
  { id: 'opt-sedan', label: 'Sedan', priceCents: 12000, durationMinutes: 120 },
  { id: 'opt-suv', label: 'SUV', priceCents: 14000, durationMinutes: 150 },
];

const addOns = [{ id: 'addon-1', name: 'Pet hair', priceCents: 3000 }];

const mobileOnlyLocation = {
  mode: 'mobile_only' as const,
  profileLocationLabel: 'Austin, TX',
  shopAddressLabel: null,
  shopStreet: '',
  shopUnit: '',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  hasCompleteShopAddress: false,
};

const bothLocation = {
  ...mobileOnlyLocation,
  mode: 'both' as const,
  shopAddressLabel: '100 Main St, Austin, TX 78701',
  shopStreet: '100 Main St',
  hasCompleteShopAddress: true,
};

async function continueFromOverview(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(screen.getByRole('button', { name: /^continue$/i }));
}

describe('ServiceDetailsScreen flow', () => {
  it('shows the selected service and description before options', () => {
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
      />
    );

    expect(screen.getByText(baseService.name)).toBeTruthy();
    expect(screen.getByText(baseService.description)).toBeTruthy();
    expect(
      screen.queryByRole('heading', { name: /choose pricing option/i })
    ).toBeNull();
    expect(screen.queryByText('summary')).toBeNull();
  });

  it('shows pricing options after continue, then reveals add-ons after a selection', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
      />
    );

    await continueFromOverview(user);

    expect(
      screen.getByRole('heading', { name: /choose pricing option/i })
    ).toBeTruthy();
    expect(screen.queryByText(/optional add-ons/i)).toBeNull();

    await user.click(screen.getByRole('button', { name: /pick sedan/i }));
    expect(screen.getByText(/optional add-ons/i)).toBeTruthy();
  });

  it('commits the selected option and add-ons to the visit cart, then navigates to the calendar', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
      />
    );

    await continueFromOverview(user);
    await user.click(screen.getByRole('button', { name: /pick suv/i }));
    await user.click(screen.getByRole('button', { name: /toggle pet hair/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const cart = loadPublicBookingJobsCart('acme-auto');
    expect(cart?.jobs).toHaveLength(1);
    expect(cart?.jobs[0].serviceId).toBe('svc-1');
    expect(cart?.jobs[0].servicePriceOptionLabel).toBe('SUV');
    expect(cart?.jobs[0].selectedAddOns.map(a => a.name)).toEqual(['Pet hair']);
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush.mock.calls[0][0]).toContain('/acme-auto/book');
  });

  it('commits the selected option to the cart when there are no add-ons', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={[]}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
      />
    );

    await continueFromOverview(user);
    await user.click(screen.getByRole('button', { name: /pick sedan/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const cart = loadPublicBookingJobsCart('acme-auto');
    expect(cart?.jobs[0].servicePriceOptionLabel).toBe('Sedan');
    expect(cart?.jobs[0].selectedAddOns).toHaveLength(0);
  });

  it('hides optional add-ons until a pricing option is selected', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
      />
    );

    await continueFromOverview(user);
    expect(screen.queryByText(/optional add-ons/i)).toBeNull();
    await user.click(screen.getByRole('button', { name: /pick sedan/i }));
    expect(screen.getByText(/optional add-ons/i)).toBeTruthy();
  });

  it('shows the calendar skeleton immediately after Continue is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={[]}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
      />
    );

    await continueFromOverview(user);
    await user.click(screen.getByRole('button', { name: /pick sedan/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(screen.getByText('calendar loading')).toBeTruthy();
  });

  it('owner manual booking navigates via URL with priceOptionId, add-ons, and detailsStep', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
        isOwnerManualBooking
      />
    );

    await continueFromOverview(user);
    await user.click(screen.getByRole('button', { name: /pick suv/i }));
    await user.click(screen.getByRole('button', { name: /toggle pet hair/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    const pushedUrl = mockRouterPush.mock.calls[0][0] as string;
    expect(pushedUrl).toContain('/acme-auto/book?');
    expect(pushedUrl).toContain('serviceId=svc-1');
    expect(pushedUrl).toContain('priceOptionId=opt-suv');
    expect(pushedUrl).toContain('addOnIds=addon-1');
    expect(pushedUrl).toContain('detailsStep=price');
    // Owner path doesn't touch the public cart.
    expect(loadPublicBookingJobsCart('acme-auto')).toBeNull();
  });

  it('restores the combined details screen from a legacy detailsStep=addons deep link', () => {
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={mobileOnlyLocation}
        initialPriceOptionId="opt-sedan"
        initialDetailsStep="addons"
      />
    );

    expect(
      screen.getByRole('heading', { name: /choose pricing option/i })
    ).toBeTruthy();
    expect(screen.getByText(/optional add-ons/i)).toBeTruthy();
  });

  it('asks for mobile vs shop before calendar when business offers both', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={bothLocation}
      />
    );

    await continueFromOverview(user);
    await user.click(screen.getByRole('button', { name: /pick suv/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    expect(
      screen.getByRole('heading', { name: /where should service happen/i })
    ).toBeTruthy();

    await user.click(screen.getByRole('radio', { name: /at my address/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));

    const cart = loadPublicBookingJobsCart('acme-auto');
    expect(cart?.serviceLocationType).toBe('mobile');
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush.mock.calls[0][0]).toContain(
      'serviceLocationType=mobile'
    );
  });
});
