import type { ReactNode } from 'react';

/**
 * Shared shell for the public booking funnel (`/[slug]/book`, `/[slug]/book/details`, …).
 * Keeps background + min height in one place so nested pages stay layout-only.
 */
export default function BusinessBookRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
      {children}
    </div>
  );
}
