/** Receipt card width: full width on phones, progressively wider on tablet/desktop. */
export const PUBLIC_INVOICE_MAX_WIDTH_CLASS =
  'max-w-[480px] md:max-w-[560px] lg:max-w-[640px]';

export const PUBLIC_INVOICE_CONTAINER_CLASS = `mx-auto w-full ${PUBLIC_INVOICE_MAX_WIDTH_CLASS}`;

export const PUBLIC_INVOICE_SECTION_LABEL_CLASS =
  'text-[13px] font-medium text-[#888480] dark:text-[#aaa8a4]';

/** Long labels wrap cleanly; unbroken strings still break instead of overflowing. */
export const PUBLIC_INVOICE_TEXT_WRAP_CLASS =
  'min-w-0 break-words [overflow-wrap:anywhere]';

/** Two-column row: flexible label column + pinned amount on the right. */
export const PUBLIC_INVOICE_LINE_ROW_CLASS =
  'flex items-start justify-between gap-x-4 gap-y-1';

export const PUBLIC_INVOICE_AMOUNT_COLUMN_CLASS = 'shrink-0 pt-0.5 text-right';
