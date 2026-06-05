'use client';

import { Select } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { FolderIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useMemo } from 'react';
import type { ServiceCategoryRow } from './categoryTypes';

const NO_CATEGORY_VALUE = '__none__';

export interface ServiceCategoryPickerSectionProps {
  categories: ServiceCategoryRow[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  /** Link target for empty / manage categories (defaults to services tab). */
  manageCategoriesHref?: string;
}

/**
 * Category picker for service edit — compact dropdown for several categories.
 */
export const ServiceCategoryPickerSection: React.FC<
  ServiceCategoryPickerSectionProps
> = ({
  categories,
  selectedCategoryId,
  onSelect,
  manageCategoriesHref = `${ROUTES.DASHBOARD.SERVICES}?tab=categories`,
}) => {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const selectOptions = useMemo(
    () => [
      { value: NO_CATEGORY_VALUE, label: 'No category' },
      ...sortedCategories.map(c => ({ value: c.id, label: c.name })),
    ],
    [sortedCategories]
  );

  const selectValue = selectedCategoryId ?? NO_CATEGORY_VALUE;

  const handleSelectChange = (value: string) => {
    onSelect(value === NO_CATEGORY_VALUE ? null : value);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-base font-bold text-white tracking-tight mb-4">
        Category
      </h2>

      {sortedCategories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center">
          <FolderIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No categories yet. Create some to organize this service.
          </p>
          <Link
            href={manageCategoriesHref}
            className="inline-block mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Manage categories
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <Select
            label="Assign to category"
            value={selectValue}
            onChange={handleSelectChange}
            options={selectOptions}
            placeholder="Select a category"
          />
          <Link
            href={manageCategoriesHref}
            className="inline-block text-xs font-medium text-gray-500 hover:text-emerald-400 transition-colors"
          >
            Manage categories
          </Link>
        </div>
      )}
    </section>
  );
};
