import { LuBot } from 'react-icons/lu';
import React from 'react';

const SIZE = {
  sm: { box: 'h-6 w-6', icon: 'h-3.5 w-3.5' },
  md: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  lg: { box: 'h-14 w-14', icon: 'h-7 w-7' },
} as const;

/** White circle with Lucide’s bot mark. */
export function AssistantMark({ size = 'md' }: { size?: keyof typeof SIZE }) {
  const { box, icon } = SIZE[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white text-black ${box}`}
      aria-hidden
    >
      <LuBot className={icon} />
    </span>
  );
}
