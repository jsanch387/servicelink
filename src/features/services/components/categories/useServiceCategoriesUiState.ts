'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ServiceCategoryRow } from './categoryTypes';
import {
  loadServiceCategoriesUiState,
  saveServiceCategoriesUiState,
} from './serviceCategoriesUiStorage';

export function useServiceCategoriesUiState(businessId: string) {
  const [categories, setCategories] = useState<ServiceCategoryRow[]>([]);
  const [serviceCategoryIds, setServiceCategoryIds] = useState<
    Record<string, string | null>
  >({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadServiceCategoriesUiState(businessId);
    setCategories(stored.categories);
    setServiceCategoryIds(stored.serviceCategoryIds);
    setHydrated(true);
  }, [businessId]);

  useEffect(() => {
    if (!hydrated) return;
    saveServiceCategoriesUiState(businessId, {
      categories,
      serviceCategoryIds,
    });
  }, [businessId, categories, serviceCategoryIds, hydrated]);

  const assignServiceCategory = useCallback(
    (serviceId: string, categoryId: string | null) => {
      setServiceCategoryIds(prev => ({
        ...prev,
        [serviceId]: categoryId,
      }));
    },
    []
  );

  const clearCategoryAssignments = useCallback((categoryId: string) => {
    setServiceCategoryIds(prev => {
      const next = { ...prev };
      for (const [serviceId, assignedId] of Object.entries(next)) {
        if (assignedId === categoryId) {
          next[serviceId] = null;
        }
      }
      return next;
    });
  }, []);

  return {
    categories,
    setCategories,
    serviceCategoryIds,
    assignServiceCategory,
    clearCategoryAssignments,
    hydrated,
  };
}
