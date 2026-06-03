import React from 'react';

interface ReviewsDashboardShellProps {
  children: React.ReactNode;
  /** Detail view uses default padding only (no extra bottom on main column). */
  variant?: 'list' | 'detail';
}

export const ReviewsDashboardShell: React.FC<ReviewsDashboardShellProps> = ({
  children,
  variant = 'list',
}) => {
  const innerPadding =
    variant === 'list'
      ? 'px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10'
      : 'px-4 py-8 sm:px-6 sm:py-10 lg:px-8';

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div
        className={`mx-auto w-full min-w-0 max-w-3xl flex-1 ${innerPadding}`}
      >
        {children}
      </div>
    </main>
  );
};
