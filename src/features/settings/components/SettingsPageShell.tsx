import React from 'react';

export interface SettingsPageShellProps {
  children: React.ReactNode;
}

export const SettingsPageShell: React.FC<SettingsPageShellProps> = ({
  children,
}) => (
  <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
    <div className="max-w-2xl mx-auto w-full min-w-0">
      <header className="mb-7">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">
          Manage your sharing, billing, and account.
        </p>
      </header>
      <div className="space-y-7 w-full min-w-0">{children}</div>
    </div>
  </main>
);
