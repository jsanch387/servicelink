import React from 'react';

/** One size for every dashboard filter trigger. */
export const filterButtonClassName =
  'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-xs text-gray-200 transition-colors hover:border-white/30 hover:bg-white/[0.04] disabled:cursor-not-allowed';

type FilterButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const FilterButton = React.forwardRef<
  HTMLButtonElement,
  FilterButtonProps
>(function FilterButton(
  { className = '', type = 'button', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${filterButtonClassName} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
