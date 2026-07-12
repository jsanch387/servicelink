import './EchoBarsLoader.css';

const BAR_COUNT = 5;
const PULSE_MS = 400;

const ECHO_BAR_SIZES = {
  default: { barWidth: 5, barHeight: 15, barGap: 10, staggerMs: 110 },
  large: { barWidth: 8, barHeight: 28, barGap: 14, staggerMs: 120 },
} as const;

export type EchoBarsLoaderSize = keyof typeof ECHO_BAR_SIZES;

export interface EchoBarsLoaderProps {
  accessibilityLabel?: string;
  color?: string;
  size?: EchoBarsLoaderSize;
  className?: string;
}

/** Five pill bars with a left-to-right opacity wave (matches mobile EchoBarsLoader). */
export function EchoBarsLoader({
  accessibilityLabel = 'Loading',
  color = '#a3a3a3',
  size = 'default',
  className = '',
}: EchoBarsLoaderProps) {
  const { barWidth, barHeight, barGap, staggerMs } = ECHO_BAR_SIZES[size];

  return (
    <div
      className={`echo-bars-loader ${className}`.trim()}
      role="progressbar"
      aria-label={accessibilityLabel}
      style={{ gap: barGap, height: barHeight }}
    >
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <div
          key={index}
          className="echo-bars-loader__bar"
          style={{
            width: barWidth,
            height: barHeight,
            borderRadius: barHeight / 2,
            backgroundColor: color,
            animationDelay: `${index * staggerMs}ms`,
            animationDuration: `${PULSE_MS * 2}ms`,
          }}
        />
      ))}
    </div>
  );
}
