import type { AssistantTextUsage } from '../server/assistantUsageMonth';

/** Desktop ring. Mobile uses a slightly smaller SVG via CSS width/height. */
const SIZE = 16;
const STROKE = 2.25;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Compact monthly text meter for the prepare header.
 * Pill: ring + “12 of 30 texts this month”.
 */
export function TextUsageRing({ usage }: { usage: AssistantTextUsage }) {
  const ratio =
    usage.limit <= 0 ? 0 : Math.min(1, Math.max(0, usage.sent / usage.limit));
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const nearLimit = usage.remaining > 0 && usage.remaining <= 5;
  const empty = usage.remaining === 0;
  const label = `${usage.sent} of ${usage.limit} texts this month`;

  return (
    <div
      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[#2E2E2E] bg-[#1C1C1C] pr-2.5 pl-2 lg:h-9 lg:gap-2.5 lg:pr-3.5 lg:pl-3"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={usage.limit}
      aria-valuenow={usage.sent}
      aria-label={label}
      title={label}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-3 w-3 shrink-0 -rotate-90 lg:h-4 lg:w-4"
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-[#3A3A3A]"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={
            empty
              ? 'text-[#E57373]'
              : nearLimit
                ? 'text-[#E8B86D]'
                : 'text-white'
          }
        />
      </svg>
      <p className="text-[12px] leading-none whitespace-nowrap tracking-[-0.01em] lg:text-[14px]">
        <span className="font-semibold text-[#F5F5F5] tabular-nums">
          {usage.sent} of {usage.limit} texts
        </span>
        <span className="hidden font-normal text-[#8F8F8F] sm:inline">
          {' '}
          this month
        </span>
      </p>
    </div>
  );
}
