/**
 * Mock add-ons pool and assignments for UI prototype.
 * Add-ons are global; services enable subsets via assignment.
 */

import type { AddOnRow } from './addOnTypes';

let idCounter = 1;
export function nextAddOnId(): string {
  return `mock-addon-${idCounter++}`;
}

/** Initial add-ons in the global pool. */
export const MOCK_ADDONS_POOL: AddOnRow[] = [
  {
    id: nextAddOnId(),
    name: 'Pet Hair Removal',
    price_cents: 2500,
    duration_minutes: null,
    sort_order: 0,
  },
  {
    id: nextAddOnId(),
    name: 'Engine Bay Cleaning',
    price_cents: 3000,
    duration_minutes: null,
    sort_order: 1,
  },
  {
    id: nextAddOnId(),
    name: 'Headlight Restoration',
    price_cents: 4000,
    duration_minutes: null,
    sort_order: 2,
  },
  {
    id: nextAddOnId(),
    name: 'Odor Eliminator',
    price_cents: 1500,
    duration_minutes: null,
    sort_order: 3,
  },
  {
    id: nextAddOnId(),
    name: 'Clay Wax',
    price_cents: 4500,
    duration_minutes: null,
    sort_order: 4,
  },
  {
    id: nextAddOnId(),
    name: 'Tire Shine',
    price_cents: 2000,
    duration_minutes: null,
    sort_order: 5,
  },
];

/** Mock: which add-on IDs are enabled for each service. */
export type AddOnAssignments = Record<string, string[]>;
