'use client';

import type { AddOnRow } from '@/features/services/components/add-ons/addOnTypes';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import { CategoriesContent } from '@/features/services/components/categories';
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
  initialServices: ServiceRow[];
  initialCategories?: ServiceCategoryRow[];
  fetchError?: string | null;
  categoriesFetchError?: string | null;
  addOnCounts?: Record<string, number>;
  initialAddOns?: AddOnRow[];
  addOnsFetchError?: string | null;
  hasProAccess?: boolean;
}

/**
 * Services dashboard with tabs for Services, Categories, and Add-ons.
 */
export const ServicesWithAddOnsView: React.FC<ServicesWithAddOnsViewProps> = ({
  initialServices,
  initialCategories = [],
  fetchError,
  categoriesFetchError,
  addOnCounts,
  initialAddOns = [],
  addOnsFetchError,
  hasProAccess = true,
}) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('services');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (isTabKey(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-shrink-0 bg-[var(--dashboard-bg)] px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-3">
        <div className="max-w-2xl mx-auto w-full min-w-0">
          <div className="flex w-full p-1.5 rounded-xl border border-white/10">
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
          categories={initialCategories}
        />
      ) : activeTab === 'categories' ? (
        <CategoriesContent
          initialCategories={initialCategories}
          initialServices={initialServices}
          fetchError={categoriesFetchError}
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
