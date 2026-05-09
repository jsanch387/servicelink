'use client';

type BookingFlowProgressBarProps = {
  /** Completion in the range 0–1 (clamped). */
  value: number;
};

/**
 * Thin full-bleed bar under sticky booking nav; fills as the user advances.
 */
export function BookingFlowProgressBar({ value }: BookingFlowProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      className="h-[3px] w-full bg-white/[0.08]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-emerald-400/85 transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
