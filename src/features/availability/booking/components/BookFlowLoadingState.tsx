import { EchoBarsLoader } from '@/components/shared/EchoBarsLoader';

/** Neutral loader for book funnel routes while the next screen is loading. */
export function BookFlowLoadingState() {
  return (
    <div
      className="flex flex-1 items-center justify-center min-h-[60vh]"
      aria-busy
      aria-live="polite"
    >
      <EchoBarsLoader
        size="xl"
        color="#a3a3a3"
        accessibilityLabel="Loading booking"
      />
    </div>
  );
}

/** Covers the current screen the instant booking navigation starts. */
export function BookFlowAdvancingOverlay() {
  return (
    <div className="fixed inset-0 z-[200] flex bg-[var(--dashboard-bg)]">
      <BookFlowLoadingState />
    </div>
  );
}
