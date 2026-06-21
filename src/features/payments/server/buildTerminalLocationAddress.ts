import type Stripe from 'stripe';

export interface TerminalLocationAddress {
  line1: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

interface BusinessProfileRow {
  business_name: string;
  service_area: string | null;
}

function parseCityState(serviceArea: string | null | undefined): {
  city: string;
  state: string;
} {
  const value = serviceArea?.trim() ?? '';
  if (!value) {
    return { city: '', state: '' };
  }
  const [cityPart = '', statePart = ''] = value.split(',');
  return {
    city: cityPart.trim(),
    state: statePart.trim().slice(0, 2).toUpperCase(),
  };
}

function readStripeAddress(
  account: Stripe.Account | null | undefined
): TerminalLocationAddress | null {
  const candidates = [
    account?.company?.address,
    account?.individual?.address,
    account?.business_profile?.support_address,
  ];

  for (const addr of candidates) {
    if (!addr) continue;
    const line1 = addr.line1?.trim();
    const city = addr.city?.trim();
    const state = addr.state?.trim();
    const postalCode = addr.postal_code?.trim();
    const country = (addr.country ?? 'US').trim().toUpperCase();
    if (line1 && city && state && postalCode) {
      return {
        line1,
        city,
        state: state.slice(0, 2).toUpperCase(),
        country,
        postal_code: postalCode,
      };
    }
  }

  return null;
}

/**
 * Builds a Stripe Terminal Location address from Connect account data and/or
 * business profile. Mobile detailers often lack a street address — use service
 * area + sensible US defaults when Stripe has no address on file.
 */
export function buildTerminalLocationAddress(
  profile: BusinessProfileRow,
  stripeAccount?: Stripe.Account | null
): TerminalLocationAddress {
  const fromStripe = readStripeAddress(stripeAccount);
  if (fromStripe) {
    return fromStripe;
  }

  const businessName = profile.business_name?.trim() || 'ServiceLink business';
  const { city, state } = parseCityState(profile.service_area);

  return {
    line1: businessName.slice(0, 100),
    city: city || 'Los Angeles',
    state: state || 'CA',
    country: 'US',
    postal_code: '90001',
  };
}
