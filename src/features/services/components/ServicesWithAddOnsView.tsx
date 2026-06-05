'use client';

import type { AddOnRow } from '@/features/services/components/add-ons/addOnTypes';
import { CategoriesContent } from '@/features/services/components/categories';
import { useServiceCategoriesUiState } from '@/features/services/components/categories/useServiceCategoriesUiState';
import type { ServiceRow } from '@/features/services/types/services';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ServicesContent } from './ServicesContent';
import { AddOnsContent } from './add-ons';

type TabKey = 'services' | 'categories' | 'addons';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'services', label: 'Services' },
  { key: 'categories', label: 'Categories' },
  { key: 'addons', label: 'Add-ons' },
];

function isTabKey(value: string | null): value is TabKey {
  return value === 'services' || value === 'categories' || value === 'addons';
}

export interface ServicesWithAddOnsViewProps {
  businessId: string;
  initialServices: ServiceRow[];
  fetchError?: string | null;
  /** Map of service ID → add-on count. */
  addOnCounts?: Record<string, number>;
  /** Add-ons from database (for Add-ons tab). */
  initialAddOns?: AddOnRow[];
  /** Error from add-ons fetch. */
  addOnsFetchError?: string | null;
  /**
   * When false, Free-plan service cap is enforced in the UI from live service count.
   */
  hasProAccess?: boolean;
}

/**
 * Services dashboard with tabs for Services, Categories, and Add-ons.
 */
export const ServicesWithAddOnsView: React.FC<ServicesWithAddOnsViewProps> = ({
  businessId,
  initialServices,
  fetchError,
  addOnCounts,
  initialAddOns = [],
  addOnsFetchError,
  hasProAccess = true,
}) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('services');

  const {
    categories,
    setCategories,
    serviceCategoryIds,
    assignServiceCategory,
    clearCategoryAssignments,
  } = useServiceCategoriesUiState(businessId);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isTabKey(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-shrink-0 border-b border-white/10 bg-[var(--dashboard-bg)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex w-full p-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer touch-manipulation ${
                  activeTab === key
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'services' ? (
        <ServicesContent
          initialServices={initialServices}
          fetchError={fetchError}
          addOnCounts={addOnCounts}
          hasProAccess={hasProAccess}
          categories={categories}
          serviceCategoryIds={serviceCategoryIds}
          onServiceCategoryAssign={assignServiceCategory}
          onManageCategories={() => setActiveTab('categories')}
        />
      ) : activeTab === 'categories' ? (
        <CategoriesContent
          categories={categories}
          onCategoriesChange={setCategories}
          serviceCategoryIds={serviceCategoryIds}
          onCategoryDeleted={clearCategoryAssignments}
        />
      ) : (
        <AddOnsContent
          initialAddOns={initialAddOns}
          fetchError={addOnsFetchError}
        />
      )}
    </div>
  );
};
