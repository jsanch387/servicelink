import React from 'react';

/** Apple logo for Sign in with Apple. Use on a dark button (white glyph). */
export const AppleIcon: React.FC<{ className?: string }> = ({
  className = 'h-5 w-5',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    fill="currentColor"
  >
    <path d="M16.365 12.79c.03 3.24 2.84 4.32 2.87 4.33-.02.08-.45 1.54-1.48 3.05-.89 1.31-1.82 2.61-3.27 2.64-1.43.03-1.89-.85-3.53-.85-1.63 0-2.14.82-3.5.88-1.4.05-2.47-1.42-3.37-2.72C2.2 17.3.8 12.44 2.69 9.16c.94-1.63 2.61-2.66 4.43-2.69 1.38-.03 2.68.93 3.53.93.84 0 2.42-1.15 4.08-.98.7.03 2.65.28 3.91 2.12-.1.06-2.33 1.36-2.3 4.05ZM13.54 4.27c.75-.9 1.25-2.16 1.11-3.42-1.08.04-2.38.72-3.15 1.62-.69.8-1.3 2.09-1.14 3.32 1.2.09 2.43-.61 3.18-1.52Z" />
  </svg>
);
