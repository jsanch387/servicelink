'use client';

import { Button } from '@/components/shared';
import { ArrowsUpDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

/** Shared typography for Services / Categories / Add-ons count rows. */
const TAB_LIST_COUNT_CLASS = 'text-sm font-medium leading-none text-gray-500';
const TAB_LIST_REORDER_CLASS =
  'inline-flex items-center gap-1.5 text-sm font-medium leading-none text-white underline underline-offset-2 decoration-white/80 transition-opacity touch-manipulation cursor-pointer hover:opacity-80 disabled:opacity-60 disabled:cursor-wait';

export interface ServicesTabListHeaderProps {
  countLabel: string;
  /** When omitted, reorder control is hidden (add-ons tab for now). */
  reorder?: {
    onClick: () => void;
    /** When false, control is hidden unless already reordering. */
    canReorder: boolean;
    isSaving: boolean;
    isReorderMode: boolean;
  };
}

export function ServicesTabListHeader({
  countLabel,
  reorder,
}: ServicesTabListHeaderProps) {
  const showReorder =
    reorder != null && (reorder.isReorderMode || reorder.canReorder);

  return (
    <div className="flex min-h-[20px] items-center justify-between gap-3 px-0.5">
      <span className={TAB_LIST_COUNT_CLASS}>{countLabel}</span>
      {showReorder ? (
        <button
          type="button"
          onClick={reorder.onClick}
          disabled={reorder.isSaving}
          className={TAB_LIST_REORDER_CLASS}
        >
          {reorder.isSaving ? (
            <>
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              Saving
            </>
          ) : (
            <>
              <ArrowsUpDownIcon className="h-3.5 w-3.5 shrink-0" />
              {reorder.isReorderMode ? 'Finish sorting' : 'Reorder'}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

export interface ServicesTabStickyAddBarProps {
  addLabel: string;
  onAdd: () => void;
  addDisabled?: boolean;
  visible?: boolean;
}

export function ServicesTabStickyAddBar({
  addLabel,
  onAdd,
  addDisabled = false,
  visible = true,
}: ServicesTabStickyAddBarProps) {
  if (!visible) return null;

  return (
    <div
      className="sticky bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4 safe-area-pb"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-2xl mx-auto">
        <Button
          variant="inverse"
          onClick={onAdd}
          disabled={addDisabled}
          icon={<PlusIcon className="h-4 w-4 text-black" />}
          fullWidth
        >
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
