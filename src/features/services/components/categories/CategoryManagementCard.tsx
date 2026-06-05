'use client';

import { GlassCard } from '@/components/shared';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { ServiceCategoryRow } from './categoryTypes';

export interface CategoryManagementCardProps {
  category: ServiceCategoryRow;
  serviceCount: number;
  onEdit: (category: ServiceCategoryRow) => void;
  onDelete: (categoryId: string) => void;
}

export const CategoryManagementCard: React.FC<CategoryManagementCardProps> = ({
  category,
  serviceCount,
  onEdit,
  onDelete,
}) => {
  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      padding="md"
      className="w-full min-w-0 transition-all duration-200 group"
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              {category.name}
            </h3>
            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-500">
              {serviceCount} service{serviceCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

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
      </div>
    </GlassCard>
  );
};
