/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/**
 * Mock data for the service details + add-ons flow (UI prototype only).
 * Not connected to database.
 */

import type { ServiceAddOn, ServiceDetailView } from './types';

/** Mock service for the details screen. In real flow this would come from API by serviceId. */
export const MOCK_SERVICE: ServiceDetailView = {
  id: 'mock-service-1',
  name: 'Full Interior Detail',
  description:
    'Deep clean and condition all interior surfaces: seats, carpets, dash, console, and windows. Includes vacuum, wipe-down, and interior protectant.',
  priceCents: 12000, // $120
  durationMinutes: 180, // 3 hours
};

/** Mock add-ons for the service details screen. */
export const MOCK_ADD_ONS: ServiceAddOn[] = [
  { id: 'addon-1', name: 'Pet Hair Removal', priceCents: 2500 },
  { id: 'addon-2', name: 'Engine Bay Cleaning', priceCents: 3000 },
  { id: 'addon-3', name: 'Headlight Restoration', priceCents: 4000 },
];

/**
 * Get mock service for a given serviceId (for prototype we return same mock; later replace with API).
 */
export function getMockServiceForId(_serviceId: string): ServiceDetailView {
  return MOCK_SERVICE;
}

/**
 * Get mock add-ons for a service (for prototype we return same list; later replace with API).
 */
export function getMockAddOnsForService(_serviceId: string): ServiceAddOn[] {
  return MOCK_ADD_ONS;
}

/**
 * Resolve add-on IDs to full add-on objects. Used when passing add-ons from service details to calendar.
 */
export function getAddOnsByIds(ids: string[]): ServiceAddOn[] {
  if (ids.length === 0) return [];
  const idSet = new Set(ids.filter(Boolean));
  return MOCK_ADD_ONS.filter(a => idSet.has(a.id));
}
