import { EchoBarsLoader } from '@/components/shared/EchoBarsLoader';

/** Neutral loader for book funnel routes while destination screen is unknown. */
export function BookFlowLoadingState() {
  return (
    <div
      className="flex flex-1 items-center justify-center min-h-[60vh]"
      aria-busy
      aria-live="polite"
    >
      <EchoBarsLoader
        size="large"
        color="#a3a3a3"
        accessibilityLabel="Loading booking"
      />
    </div>
  );
}
