import React from 'react';

interface LabelBadgeProps {
  label: string;
  className?: string;
}

function LabelBadge({ label, className = '' }: LabelBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/[0.06] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-zinc-300 ${className}`}
    >
      {label}
    </span>
  );
}

interface BetaBadgeProps {
  className?: string;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ className = '' }) => {
  return <LabelBadge label="Beta" className={className} />;
};

export const NewBadge: React.FC<BetaBadgeProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border border-emerald-400/35 bg-emerald-500/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-emerald-300 ${className}`}
    >
      New
    </span>
  );
};
