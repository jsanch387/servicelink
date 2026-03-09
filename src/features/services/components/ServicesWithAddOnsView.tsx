'use client';

import type { ServiceRow } from '@/features/services/types/services';
import { useState } from 'react';
import { ServicesContent } from './ServicesContent';
import { AddOnsContent } from './add-ons';

type TabKey = 'services' | 'addons';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'services', label: 'Services' },
  { key: 'addons', label: 'Add-ons' },
];

export interface ServicesWithAddOnsViewProps {
  initialServices: ServiceRow[];
  fetchError?: string | null;
  /** Map of service ID → add-on count. */
  addOnCounts?: Record<string, number>;
}

/**
 * Services dashboard with toggle between Services and Add-ons.
 * Renders ServicesContent or AddOnsContent based on active tab.
 */
export const ServicesWithAddOnsView: React.FC<ServicesWithAddOnsViewProps> = ({
  initialServices,
  fetchError,
  addOnCounts,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('services');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Segmented tab control — mobile: full-width, desktop: compact pill */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[var(--dashboard-bg)]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex w-full sm:w-auto sm:min-w-[280px] p-1.5 rounded-xl bg-white/[0.04] border border-white/10">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer touch-manipulation ${
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

      {/* Tab content */}
      {activeTab === 'services' ? (
        <ServicesContent
          initialServices={initialServices}
          fetchError={fetchError}
          addOnCounts={addOnCounts}
        />
      ) : (
        <AddOnsContent />
      )}
    </div>
  );
};
