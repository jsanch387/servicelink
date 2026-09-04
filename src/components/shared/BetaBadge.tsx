import React from 'react';

interface BetaBadgeProps {
  className?: string;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-zinc-300 ${className}`}
    >
      Beta
    </span>
  );
};
