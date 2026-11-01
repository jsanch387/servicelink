import React from 'react';

/** Filled filter and secondary action. Same control as the customer screen. */
export const filterButtonClassName =
  'inline-flex h-9 min-h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-[#2c2c2c] px-3.5 text-sm text-gray-100 transition-colors hover:border-white/45 hover:bg-[#343434] disabled:cursor-not-allowed';

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
