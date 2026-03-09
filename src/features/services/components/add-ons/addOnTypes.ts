/**
 * Add-on types for owner management UI.
 * Mirrors future DB schema (business_service_addons).
 * UI prototype: no backend yet.
 */

export interface AddOnRow {
  id: string;
  name: string;
  price_cents: number;
  sort_order: number | null;
  /** Optional; used when add-on was per-service (legacy). Pool add-ons omit this. */
  service_id?: string;
}

export interface EditAddOnFormData {
  name: string;
  price_cents: number | null;
}
