type ConnectorPath = {
  id: string;
  d: string;
  tone?: 'default' | 'emerald';
};

/** Paths run through side margins — visible under the mock, hidden beneath the phones. */
const CONNECTORS: ConnectorPath[] = [
  {
    id: 'deposit',
    tone: 'emerald',
    d: 'M 32 37 C 26 33, 20 28, 16 22',
  },
  {
    id: 'appointment',
    d: 'M 32 51 C 26 51, 20 50, 16 48',
  },
  {
    id: 'link',
    d: 'M 68 39 C 74 39, 80 38, 91 25',
  },
  {
    id: 'views',
    tone: 'emerald',
    d: 'M 68 54 C 74 54, 80 56, 88 51',
  },
];

const strokeByTone = {
  emerald: {
    line: 'rgb(52 211 153 / 0.55)',
  },
  default: {
    line: 'rgb(255 255 255 / 0.32)',
  },
} as const;

export function HeroFloatingConnectors() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter
          id="hero-connector-soft-glow"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {CONNECTORS.map(({ id, d, tone = 'default' }) => {
        const colors = strokeByTone[tone];

        return (
          <path
            key={id}
            d={d}
            fill="none"
            stroke={colors.line}
            strokeWidth={1.5}
            strokeDasharray="7 5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            filter="url(#hero-connector-soft-glow)"
          />
        );
      })}
    </svg>
  );
}
