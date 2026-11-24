/** Shared text-field chrome. Inputs, selects, and dropdowns use this so a size change happens once. */

export const fieldLabelClassName =
  'mb-2 block text-left text-sm font-medium text-white';

/** Border, fill, corner, and focus. No height, so text areas can share it. */
export const fieldSurfaceClassName =
  'rounded-lg border border-white/15 bg-white/[0.04] font-normal focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-colors duration-200';

/** Standard control height, same as `Button` size `sm` (36px). */
export const fieldHeightClassName = 'h-9 min-h-9';

/** Single-line control. Same height, padding, and corner as `Button` `sm`. */
export const fieldBoxClassName = `${fieldHeightClassName} px-3.5 ${fieldSurfaceClassName}`;
