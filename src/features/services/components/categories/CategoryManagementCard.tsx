'use client';

import { GlassCard } from '@/components/shared';
import { serviceListingNameClassName } from '@/components/shared/serviceListingTypography';
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import type { ServiceCategoryRow } from './categoryTypes';

export interface CategoryManagementCardProps {
  category: ServiceCategoryRow;
  index: number;
  serviceCount: number;
  isReorderMode?: boolean;
  totalCount?: number;
  draggable?: boolean;
  onEdit: (category: ServiceCategoryRow) => void;
  onDelete: (categoryId: string) => void;
  onDragStart?: (index: number) => void;
  onDragEnd?: () => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
}

export const CategoryManagementCard: React.FC<CategoryManagementCardProps> = ({
  category,
  index,
  serviceCount,
  isReorderMode = false,
  totalCount = 0,
  draggable = false,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onMoveUp,
  onMoveDown,
}) => {
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      padding="md"
      className={`w-full min-w-0 transition-all duration-200 group ${
        isReorderMode
          ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : ''
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div
        draggable={draggable}
        onDragStart={e => {
          if (!draggable) return;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(index));
          onDragStart?.(index);
        }}
        onDragEnd={() => onDragEnd?.()}
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            {isReorderMode ? (
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex flex-col items-center justify-between gap-3 sm:gap-0.5 w-[44px] sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onMoveUp?.(index)}
                    disabled={isFirst}
                    aria-label="Move up"
                    className="flex items-center justify-center p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] w-[44px] sm:min-h-0 sm:min-w-0 sm:w-auto sm:p-1.5 sm:rounded-lg sm:text-gray-400 sm:hover:text-white sm:hover:bg-white/10"
                  >
                    <ChevronUpIcon className="h-5 w-5 flex-shrink-0" />
                  </button>
                  <span className="flex items-center justify-center w-[44px] sm:w-auto text-sm font-semibold text-white sm:text-[10px] sm:font-medium sm:text-gray-500 sm:tracking-wider tabular-nums">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => onMoveDown?.(index)}
                    disabled={isLast}
                    aria-label="Move down"
                    className="flex items-center justify-center p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] w-[44px] sm:min-h-0 sm:min-w-0 sm:w-auto sm:p-1.5 sm:rounded-lg sm:text-gray-400 sm:hover:text-white sm:hover:bg-white/10"
                  >
                    <ChevronDownIcon className="h-5 w-5 flex-shrink-0" />
                  </button>
                </div>
                <div
                  className="hidden sm:block mt-1 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 cursor-grab active:cursor-grabbing touch-none"
                  aria-label="Drag to reorder"
                >
                  <Bars3Icon className="h-5 w-5" />
                </div>
              </div>
            ) : null}

            <div className="flex-1 min-w-0">
              <h3 className={`${serviceListingNameClassName} truncate`}>
                {category.name}
              </h3>
              <p className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-500">
                {serviceCount} service{serviceCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {!isReorderMode ? (
            <div className="flex items-stretch gap-2 pt-4 sm:pt-5">
              <button
                type="button"
                onClick={() => onEdit(category)}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm font-medium rounded-xl border border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all active:scale-95 cursor-pointer touch-manipulation"
                aria-label="Edit category"
              >
                <PencilSquareIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(category.id)}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm font-medium rounded-xl border border-white/20 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400 transition-all active:scale-95 cursor-pointer touch-manipulation"
                aria-label="Delete category"
              >
                <TrashIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-red-500 flex-shrink-0" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
};
