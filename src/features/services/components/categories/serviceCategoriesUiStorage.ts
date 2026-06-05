import type { ServiceCategoryRow } from './categoryTypes';

const STORAGE_KEY_PREFIX = 'service-categories-ui:';

export interface ServiceCategoriesUiState {
  categories: ServiceCategoryRow[];
  serviceCategoryIds: Record<string, string | null>;
}

const EMPTY_STATE: ServiceCategoriesUiState = {
  categories: [],
  serviceCategoryIds: {},
};

function storageKey(businessId: string): string {
  return `${STORAGE_KEY_PREFIX}${businessId}`;
}

export function loadServiceCategoriesUiState(
  businessId: string
): ServiceCategoriesUiState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(storageKey(businessId));
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as ServiceCategoriesUiState;
    if (!parsed || typeof parsed !== 'object') return EMPTY_STATE;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      serviceCategoryIds:
        parsed.serviceCategoryIds && typeof parsed.serviceCategoryIds === 'object'
          ? parsed.serviceCategoryIds
          : {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveServiceCategoriesUiState(
  businessId: string,
  state: ServiceCategoriesUiState
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(businessId), JSON.stringify(state));
  } catch {
    // Ignore quota / private mode errors for UI preview state.
  }
}
