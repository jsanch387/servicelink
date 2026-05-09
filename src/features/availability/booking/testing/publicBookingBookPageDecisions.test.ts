/**
 * QA-style tests for `/[slug]/book` branching: what the customer should experience
 * is asserted first; `publicBookingBookPageDecisions` is the single source used by
 * the server page so regressions fail in CI instead of in production checkout.
 */
import { describe, expect, it } from 'vitest';
import {
  publicBookingCalendarExitNavWithoutConfigureFunnel,
  publicBookingServiceRequiresConfigureUi,
  publicBookingShouldRenderConfigureScheduleFunnel,
} from '../utils/publicBookingBookPageDecisions';

describe('publicBookingServiceRequiresConfigureUi', () => {
  it('returns false when the service has no multi-price and no add-ons (straight to calendar)', () => {
    expect(
      publicBookingServiceRequiresConfigureUi({
        priceOptionsEnabled: false,
        priceOptionCount: 0,
        addOnCount: 0,
      })
    ).toBe(false);
    expect(
      publicBookingServiceRequiresConfigureUi({
        priceOptionsEnabled: true,
        priceOptionCount: 0,
        addOnCount: 0,
      })
    ).toBe(false);
  });

  it('returns true when multi-price is enabled and at least one option exists', () => {
    expect(
      publicBookingServiceRequiresConfigureUi({
        priceOptionsEnabled: true,
        priceOptionCount: 2,
        addOnCount: 0,
      })
    ).toBe(true);
  });

  it('returns true when add-ons exist even if multi-price is off', () => {
    expect(
      publicBookingServiceRequiresConfigureUi({
        priceOptionsEnabled: false,
        priceOptionCount: 0,
        addOnCount: 3,
      })
    ).toBe(true);
  });

  it('returns true when both price options and add-ons exist', () => {
    expect(
      publicBookingServiceRequiresConfigureUi({
        priceOptionsEnabled: true,
        priceOptionCount: 1,
        addOnCount: 1,
      })
    ).toBe(true);
  });
});

describe('publicBookingShouldRenderConfigureScheduleFunnel', () => {
  const base = {
    needsConfigureStep: true,
    skipDetailsFlag: false,
    useAvailabilityBooking: true,
    hasConfigureBundle: true,
    showAvailabilityServicePicker: false,
    showNotAcceptingBookings: false,
  };

  it('renders funnel when all gates pass (customer must configure before calendar)', () => {
    expect(publicBookingShouldRenderConfigureScheduleFunnel(base)).toBe(true);
  });

  it('does not render funnel when there is nothing to configure', () => {
    expect(
      publicBookingShouldRenderConfigureScheduleFunnel({
        ...base,
        needsConfigureStep: false,
      })
    ).toBe(false);
  });

  it('does not render funnel when skipDetails is on (deep link / owner shortcut)', () => {
    expect(
      publicBookingShouldRenderConfigureScheduleFunnel({
        ...base,
        skipDetailsFlag: true,
      })
    ).toBe(false);
  });

  it('does not render funnel when V2 availability booking is off', () => {
    expect(
      publicBookingShouldRenderConfigureScheduleFunnel({
        ...base,
        useAvailabilityBooking: false,
      })
    ).toBe(false);
  });

  it('does not render funnel when bundle failed to load', () => {
    expect(
      publicBookingShouldRenderConfigureScheduleFunnel({
        ...base,
        hasConfigureBundle: false,
      })
    ).toBe(false);
  });

  it('does not render funnel on the service picker screen', () => {
    expect(
      publicBookingShouldRenderConfigureScheduleFunnel({
        ...base,
        showAvailabilityServicePicker: true,
      })
    ).toBe(false);
  });

  it('does not render funnel when business is not accepting bookings', () => {
    expect(
      publicBookingShouldRenderConfigureScheduleFunnel({
        ...base,
        showNotAcceptingBookings: true,
      })
    ).toBe(false);
  });
});

describe('publicBookingCalendarExitNavWithoutConfigureFunnel', () => {
  it('sends public customers to the marketing profile, not back to the same /book URL', () => {
    const nav = publicBookingCalendarExitNavWithoutConfigureFunnel({
      isOwnerManualBooking: false,
      businessSlug: 'acme-detail',
      bookingFlowLocale: 'en',
      labels: {
        backToProfile: 'Back to profile',
        backToServices: 'Back to services',
      },
    });
    expect(nav.label).toBe('Back to profile');
    expect(nav.href).toBe('/acme-detail');
    expect(nav.href).not.toMatch(/\/book\?/);
  });

  it('preserves lang on profile when locale is non-default', () => {
    const nav = publicBookingCalendarExitNavWithoutConfigureFunnel({
      isOwnerManualBooking: false,
      businessSlug: 'acme-detail',
      bookingFlowLocale: 'es',
      labels: { backToProfile: 'Volver al perfil', backToServices: 'x' },
    });
    expect(nav.href).toContain('lang=es');
    expect(nav.label).toBe('Volver al perfil');
  });

  it('sends owner manual booking back to the service picker with for=owner', () => {
    const nav = publicBookingCalendarExitNavWithoutConfigureFunnel({
      isOwnerManualBooking: true,
      businessSlug: 'acme-detail',
      bookingFlowLocale: 'en',
      labels: { backToProfile: 'x', backToServices: 'Back to services' },
    });
    expect(nav.label).toBe('Back to services');
    expect(nav.href).toContain('/acme-detail/book');
    expect(nav.href).toContain('for=owner');
  });
});
