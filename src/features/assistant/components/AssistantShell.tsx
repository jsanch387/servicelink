import React from 'react';

export function AssistantShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="relative flex w-full flex-1 flex-col px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        {children}
      </div>
    </main>
  );
}
