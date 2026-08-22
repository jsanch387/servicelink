/**
 * Marketplace specialties — what customers hire a shop for.
 *
 * `business_type` is the job bucket / booking template.
 * `business_profiles.specialties` is an optional list of these slugs.
 * NULL / empty specialties = derive from the stored type so legacy
 * Auto & Detailing shops stay listed without a backfill.
 */

import {
  resolveBusinessIndustry,
  type IndustryTemplate,
} from '@/constants/businessTypes';

export const BUSINESS_SPECIALTY_SLUGS = [
  'detailing',
  'window_tinting',
  'auto_glass',
  'mobile_repair',
  'pet_grooming',
  'pressure_washing',
  'carpet_cleaning',
  'home_cleaning',
  'lawn_care',
  'other',
] as const;

export type BusinessSpecialtySlug = (typeof BUSINESS_SPECIALTY_SLUGS)[number];

export interface BusinessSpecialtyOption {
  slug: BusinessSpecialtySlug;
  label: string;
}

const SPECIALTY_LABELS: Record<BusinessSpecialtySlug, string> = {
  detailing: 'Auto detailing',
  window_tinting: 'Window tinting',
  auto_glass: 'Auto glass',
  mobile_repair: 'Mobile mechanic',
  pet_grooming: 'Pet grooming',
  pressure_washing: 'Pressure washing',
  carpet_cleaning: 'Carpet cleaning',
  home_cleaning: 'Home cleaning',
  lawn_care: 'Lawn care',
  other: 'Other',
};

const SPECIALTIES_BY_TEMPLATE: Record<
  IndustryTemplate,
  readonly BusinessSpecialtySlug[]
> = {
  vehicle: [
    'detailing',
    'window_tinting',
    'auto_glass',
    'mobile_repair',
    'other',
  ],
  pet: ['pet_grooming', 'other'],
  property: [
    'pressure_washing',
    'carpet_cleaning',
    'home_cleaning',
    'lawn_care',
    'other',
  ],
  person: ['other'],
};

const LEGACY_TYPE_SPECIALTIES: Record<
  string,
  readonly BusinessSpecialtySlug[]
> = {
  'auto & detailing': ['detailing'],
  'mobile detailing': ['detailing'],
  automotive: ['detailing'],
  'service provider': ['detailing'],
  'window tinting': ['window_tinting'],
  'mobile repair': ['mobile_repair'],
  'pet grooming': ['pet_grooming'],
  'pressure washing': ['pressure_washing'],
  'cleaning services': ['home_cleaning'],
  'trash & bin cleaning': ['other'],
  'lawn care & landscaping': ['lawn_care'],
  beauty: ['other'],
};

const SLUG_SET = new Set<string>(BUSINESS_SPECIALTY_SLUGS);

export function isBusinessSpecialtySlug(
  value: string
): value is BusinessSpecialtySlug {
  return SLUG_SET.has(value);
}

export function sanitizeBusinessSpecialties(
  values: readonly string[] | null | undefined
): BusinessSpecialtySlug[] {
  if (!values?.length) return [];
  const seen = new Set<BusinessSpecialtySlug>();
  const next: BusinessSpecialtySlug[] = [];
  for (const value of values) {
    const slug = value.trim().toLowerCase();
    if (!isBusinessSpecialtySlug(slug) || seen.has(slug)) continue;
    seen.add(slug);
    next.push(slug);
  }
  return next;
}

export function getSpecialtiesForBusinessType(
  businessType: string | null | undefined
): BusinessSpecialtyOption[] {
  const template = resolveBusinessIndustry(businessType).template;
  return SPECIALTIES_BY_TEMPLATE[template].map(slug => ({
    slug,
    label: SPECIALTY_LABELS[slug],
  }));
}

/** Implied tags when `specialties` was never saved (legacy rows). */
export function deriveSpecialtiesFromBusinessType(
  businessType: string | null | undefined
): BusinessSpecialtySlug[] {
  const key = businessType?.trim().toLowerCase() ?? '';
  if (!key) return [];
  return [...(LEGACY_TYPE_SPECIALTIES[key] ?? [])];
}

/**
 * Explicit saved tags win. Otherwise derive from `business_type`
 * so existing Auto & Detailing shops stay findable.
 */
export function resolveBusinessSpecialties(
  businessType: string | null | undefined,
  storedSpecialties?: readonly string[] | null
): BusinessSpecialtySlug[] {
  const saved = sanitizeBusinessSpecialties(storedSpecialties);
  if (saved.length > 0) return saved;
  return deriveSpecialtiesFromBusinessType(businessType);
}

export function hasDetailingMarketplaceListing(
  businessType: string | null | undefined,
  storedSpecialties?: readonly string[] | null
): boolean {
  return resolveBusinessSpecialties(businessType, storedSpecialties).includes(
    'detailing'
  );
}
