/**
 * Public profile share / SEO copy.
 *
 * Built from specialties (what customers hire them for), not the
 * industry bucket stored on `business_type`.
 */

import { publicTradeLine } from '@/constants/businessSpecialties';

export function generatePublicProfileShareTitle(data: {
  businessName: string;
  tradeLine?: string | null;
  serviceArea?: string | null;
}): string {
  const businessName = data.businessName.trim();
  const tradeLine = data.tradeLine?.trim() ?? '';
  const serviceArea = data.serviceArea?.trim() ?? '';

  if (tradeLine && serviceArea) {
    return `${businessName} · ${tradeLine} in ${serviceArea}`;
  }
  if (tradeLine) {
    return `${businessName} · ${tradeLine}`;
  }
  if (serviceArea) {
    return `${businessName} · ${serviceArea}`;
  }
  return businessName;
}

export function generatePublicProfileShareDescription(data: {
  bio?: string | null;
  businessName: string;
  tradeLine?: string | null;
  serviceArea?: string | null;
  maxLength?: number;
}): string {
  const maxLength = data.maxLength ?? 160;
  const bio = data.bio?.trim() ?? '';
  if (bio) {
    return bio.length > maxLength ? `${bio.slice(0, maxLength - 3)}...` : bio;
  }

  const tradeLine = data.tradeLine?.trim() ?? '';
  const serviceArea = data.serviceArea?.trim() ?? '';
  if (tradeLine && serviceArea) {
    return `${tradeLine} in ${serviceArea}`;
  }
  if (tradeLine) return tradeLine;
  if (serviceArea) return `${data.businessName.trim()} in ${serviceArea}`;
  return data.businessName.trim();
}

export function resolvePublicProfileTradeLine(data: {
  businessType?: string | null;
  specialties?: readonly string[] | null;
}): string {
  return publicTradeLine(data.businessType, data.specialties);
}
