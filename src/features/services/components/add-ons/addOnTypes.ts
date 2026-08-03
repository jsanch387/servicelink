/**
 * Add-on types for owner management UI.
 * Add-ons live in service_addons pool; assignment to services via service_addon_assignments.
 */

/** Max characters for an add-on description. */
export const ADD_ON_DESCRIPTION_MAX_LENGTH = 300;

export interface AddOnRow {
  id: string;
  name: string;
  /** Optional customer-facing detail; null/empty = none. */
  description: string | null;
  price_cents: number;
  /** Optional duration (minutes); null/undefined = none. */
  duration_minutes: number | null;
  sort_order: number | null;
}

export interface EditAddOnFormData {
  name: string;
  description: string | null;
  price_cents: number | null;
  duration_minutes: number | null;
}
