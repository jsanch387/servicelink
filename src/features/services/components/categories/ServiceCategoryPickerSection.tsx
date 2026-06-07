'use client';

import { ROUTES } from '@/constants/routes';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { getCategoryNameById } from './getCategoryNameById';
import { ServiceCategoryDropdown } from './ServiceCategoryDropdown';
import type { ServiceCategoryRow } from './categoryTypes';

export interface ServiceCategoryPickerSectionProps {
  categories: ServiceCategoryRow[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  /** Link target for empty / manage categories (defaults to services tab). */
  manageCategoriesHref?: string;
}

/**
 * Category picker for service edit — collapsible section with dropdown list.
 */
export const ServiceCategoryPickerSection: React.FC<
  ServiceCategoryPickerSectionProps
> = ({
  categories,
  selectedCategoryId,
  onSelect,
  manageCategoriesHref = `${ROUTES.DASHBOARD.SERVICES}?tab=categories`,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const summaryLabel =
    getCategoryNameById(categories, selectedCategoryId) ?? 'No category';

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 mb-6 sm:mb-8">
      <button
        type="button"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0">
          <h2 className="text-lg sm:text-base font-bold text-white tracking-tight">
            Category
          </h2>
          {!isExpanded ? (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {summaryLabel}
            </p>
          ) : null}
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400 shrink-0" />
        )}
      </button>

      {isExpanded && (
        <>
          {sortedCategories.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-center">
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
            <div className="mt-4 space-y-3">
              <ServiceCategoryDropdown
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelect={onSelect}
              />
              <Link
                href={manageCategoriesHref}
                className="inline-block text-xs font-medium text-gray-500 hover:text-emerald-400 transition-colors"
              >
                Manage categories
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
};
