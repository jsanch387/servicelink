import React from 'react';

export interface SettingsPageShellProps {
  children: React.ReactNode;
}

export const SettingsPageShell: React.FC<SettingsPageShellProps> = ({
  children,
}) => (
  <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    <div className="mx-auto w-full min-w-0 max-w-2xl">
      <div className="w-full min-w-0 space-y-7">{children}</div>
    </div>
  </main>
);
