/** App crown (not in Heroicons) — Pro / premium affordances; uses `currentColor`. */
export const CrownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
  </svg>
);

/** Stroke crown for dark icon tiles (welcome modal, marketing). */
export const CrownOutlineIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 17h14" />
    <path d="M5 17 3.5 9.5 8.25 13 12 7l3.75 6 4.75-3.5L19 17" />
  </svg>
);
