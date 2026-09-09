/** Bottom-section placeholder while a profile tab paints. Header/tabs stay put. */

const tile = 'aspect-square animate-pulse rounded-xl bg-white/[0.06]';

export function PublicProfileTabPanelSkeleton({
  variant = 'generic',
  ariaLabel,
}: {
  variant?: 'gallery' | 'generic';
  ariaLabel?: string;
}) {
  if (variant === 'gallery') {
    return (
      <section
        className="px-4 py-5 sm:px-8 sm:py-6"
        aria-busy
        aria-label={ariaLabel ?? 'Loading gallery'}
      >
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={tile} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className="space-y-3 px-4 py-6 sm:px-8 sm:py-8"
      aria-busy
      aria-label="Loading"
    >
      <div className="h-4 w-2/5 max-w-[12rem] animate-pulse rounded bg-white/[0.06]" />
      <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-white/[0.06]" />
    </section>
  );
}
