import { FilterPills } from '@/components/shared';
import React from 'react';
import {
  SETTINGS_TAB_OPTIONS,
  type SettingsTabId,
} from '../constants/settingsTabs';

export interface SettingsPageShellProps {
  children: React.ReactNode;
  tab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

export const SettingsPageShell: React.FC<SettingsPageShellProps> = ({
  children,
  tab,
  onTabChange,
}) => (
  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <header className="mb-7">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Settings
        </h1>
        <div className="mt-5">
          <FilterPills
            options={[...SETTINGS_TAB_OPTIONS]}
            value={tab}
            onChange={onTabChange}
            ariaLabel="Settings sections"
          />
        </div>
      </header>
      <div className="w-full min-w-0 space-y-7">{children}</div>
    </div>
  </main>
);
