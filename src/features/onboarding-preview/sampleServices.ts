import type { BusinessSpecialtySlug } from '@/constants/businessSpecialties';
import { isBusinessSpecialtySlug } from '@/constants/businessSpecialties';

export interface SampleServicePreview {
  name: string;
  priceCents: number;
  durationMinutes: number;
  durationLabel: string;
  description: string;
}

const SAMPLE_SERVICES: Record<BusinessSpecialtySlug, SampleServicePreview> = {
  detailing: {
    name: 'Full Detail',
    priceCents: 15000,
    durationMinutes: 120,
    durationLabel: '2 hrs',
    description: 'Full detail. Edit the price and time anytime.',
  },
  window_tinting: {
    name: 'Full Tint',
    priceCents: 25000,
    durationMinutes: 180,
    durationLabel: '3 hrs',
    description: 'Full tint. Edit the price and time anytime.',
  },
  ppf: {
    name: 'Partial PPF',
    priceCents: 40000,
    durationMinutes: 240,
    durationLabel: '4 hrs',
    description: 'Partial paint protection. Edit the price and time anytime.',
  },
  auto_glass: {
    name: 'Windshield Chip Repair',
    priceCents: 8000,
    durationMinutes: 45,
    durationLabel: '45 min',
    description: 'Windshield chip repair. Edit the price and time anytime.',
  },
  mobile_repair: {
    name: 'Diagnostic Visit',
    priceCents: 12000,
    durationMinutes: 60,
    durationLabel: '1 hr',
    description: 'Diagnostic visit. Edit the price and time anytime.',
  },
  pet_grooming: {
    name: 'Full Groom',
    priceCents: 7500,
    durationMinutes: 90,
    durationLabel: '90 min',
    description: 'Full groom. Edit the price and time anytime.',
  },
  pressure_washing: {
    name: 'Driveway Wash',
    priceCents: 15000,
    durationMinutes: 120,
    durationLabel: '2 hrs',
    description: 'Driveway wash. Edit the price and time anytime.',
  },
  carpet_cleaning: {
    name: 'Room Cleaning',
    priceCents: 12000,
    durationMinutes: 60,
    durationLabel: '1 hr',
    description: 'Room cleaning. Edit the price and time anytime.',
  },
  home_cleaning: {
    name: 'Standard Clean',
    priceCents: 15000,
    durationMinutes: 120,
    durationLabel: '2 hrs',
    description: 'Standard clean. Edit the price and time anytime.',
  },
  lawn_care: {
    name: 'Lawn Mow',
    priceCents: 6000,
    durationMinutes: 45,
    durationLabel: '45 min',
    description: 'Lawn mow. Edit the price and time anytime.',
  },
  other: {
    name: 'Standard Service',
    priceCents: 10000,
    durationMinutes: 60,
    durationLabel: '1 hr',
    description: 'Standard service. Edit the price and time anytime.',
  },
};

export function sampleServiceForTrade(
  trade: string | undefined
): SampleServicePreview {
  if (trade && isBusinessSpecialtySlug(trade)) return SAMPLE_SERVICES[trade];
  return SAMPLE_SERVICES.other;
}

/** True when the row is still one of the services created during signup. */
export function isUntouchedSampleService(service: {
  name: string;
  description: string | null;
  priceCents: number | null;
  durationMinutes: number | null;
}): boolean {
  const description = service.description?.trim() ?? '';
  return Object.values(SAMPLE_SERVICES).some(
    sample =>
      sample.name === service.name.trim() &&
      sample.description === description &&
      sample.priceCents === service.priceCents &&
      sample.durationMinutes === service.durationMinutes
  );
}

export function formatSamplePrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}
