/** Shared text-field chrome. Inputs, selects, and dropdowns use this so a size change happens once. */

export const fieldLabelClassName =
  'mb-2 block text-left text-sm font-medium text-white';

/** Border, fill, corner, and focus. No height, so text areas can share it. */
export const fieldSurfaceClassName =
  'rounded-lg border border-white/15 bg-white/[0.04] font-normal focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-colors duration-200';

/** Single-line control: 32px, same 8px corner as `Button`. */
export const fieldBoxClassName = `h-8 px-3 ${fieldSurfaceClassName}`;
