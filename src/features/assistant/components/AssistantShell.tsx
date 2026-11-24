import React from 'react';

export function AssistantShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="relative flex w-full flex-1 flex-col py-6 sm:py-8 lg:py-10">
        {children}
      </div>
    </main>
  );
}
