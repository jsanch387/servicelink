import { ServiceDetailsScreen } from '@/features/services/booking-flow/ServiceDetailsScreen';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
      <a href={href}>{children}</a>
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

describe('ServiceDetailsScreen flow', () => {
  it('builds calendar URL with selected option, add-ons, and detailsStep=addons', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
      />
    );

    await user.click(screen.getByRole('button', { name: /pick suv/i }));
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    await user.click(screen.getByRole('button', { name: /toggle pet hair/i }));

    const dateTimeLink = screen.getByRole('link', { name: /date & time/i });
    expect(dateTimeLink.getAttribute('href')).toContain('/acme-auto/book?');
    expect(dateTimeLink.getAttribute('href')).toContain('serviceId=svc-1');
    expect(dateTimeLink.getAttribute('href')).toContain(
      'priceOptionId=opt-suv'
    );
    expect(dateTimeLink.getAttribute('href')).toContain('addOnIds=addon-1');
    expect(dateTimeLink.getAttribute('href')).toContain('detailsStep=addons');
  });

  it('uses detailsStep=price when no add-on step exists', async () => {
    const user = userEvent.setup();
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={[]}
        priceOptions={priceOptions}
      />
    );

    await user.click(screen.getByRole('button', { name: /pick sedan/i }));
    const dateTimeLink = screen.getByRole('link', { name: /date & time/i });

    expect(dateTimeLink.getAttribute('href')).toContain(
      'priceOptionId=opt-sedan'
    );
    expect(dateTimeLink.getAttribute('href')).toContain('detailsStep=price');
  });

  it('restores add-ons phase from calendar when detailsStep=addons is valid', () => {
    render(
      <ServiceDetailsScreen
        businessSlug="acme-auto"
        serviceId="svc-1"
        service={baseService}
        addOns={addOns}
        priceOptions={priceOptions}
        initialPriceOptionId="opt-sedan"
        initialDetailsStep="addons"
      />
    );

    expect(screen.getByText(/optional add-ons/i)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /back to options/i })
    ).toBeTruthy();
  });
});
