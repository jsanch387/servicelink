/**
 * Service category types (UI layer).
 * Backend wiring will replace local state with DB rows.
 */

export interface ServiceCategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface EditCategoryFormData {
  name: string;
}
