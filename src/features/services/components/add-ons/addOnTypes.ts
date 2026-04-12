/**
 * Add-on types for owner management UI.
 * Add-ons live in service_addons pool; assignment to services via service_addon_assignments.
 */

export interface AddOnRow {
  id: string;
  name: string;
  price_cents: number;
  /** Optional extra time (minutes); null/undefined = none. */
  duration_minutes: number | null;
  sort_order: number | null;
}

export interface EditAddOnFormData {
  name: string;
  price_cents: number | null;
  duration_minutes: number | null;
}
