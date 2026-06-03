import type { ReactNode } from 'react';
import { reviewPageSubtitle, reviewPageTitle } from '../copy/publicReviewCopy';

export type PublicReviewPageLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Used when subtitle is omitted — personal line from the business. */
  businessName?: string;
  /** Hide title/subtitle (success / error states). */
  hideHeader?: boolean;
  /** Vertically center content in the viewport (success / error states). */
  centerContent?: boolean;
};

export function PublicReviewPageLayout({
  children,
  title = reviewPageTitle(),
  subtitle,
  businessName = '',
  hideHeader = false,
  centerContent = false,
}: PublicReviewPageLayoutProps) {
  const resolvedSubtitle =
    subtitle ??
    (businessName ? reviewPageSubtitle(businessName) : reviewPageSubtitle(''));

  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)] text-white">
      <div
        className={`mx-auto flex w-full max-w-lg flex-col px-4 sm:px-6 ${
          centerContent
            ? 'min-h-screen justify-center py-12 sm:py-16'
            : 'pb-12 pt-8 sm:pb-16 sm:pt-10'
        }`}
      >
        {!hideHeader ? (
          <header className="mb-6 sm:mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
            {resolvedSubtitle ? (
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gray-400">
                {resolvedSubtitle}
              </p>
            ) : null}
          </header>
        ) : null}
        {children}
      </div>
    </main>
  );
}
