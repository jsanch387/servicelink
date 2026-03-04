'use client';

import { GlassCard, Switch } from '@/components/shared';
import type { BusinessServiceRow } from '@/features/business-profile/types/businessProfile';
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

function formatPrice(priceCents: number | null): string {
  if (priceCents == null) return 'Contact for quote';
  if (priceCents === 0) return 'Contact for quote';
  return `$${(priceCents / 100).toFixed(0)}`;
}

function formatDuration(service: BusinessServiceRow): string | null {
  const minutes = service.duration_minutes;
  const hours = service.hours_to_complete;
  if (minutes != null && minutes > 0) {
    const h = minutes / 60;
    if (h < 24) return `${h} ${h === 1 ? 'Hour' : 'Hours'}`;
    const days = Math.floor(h / 24);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  }
  if (hours != null && hours > 0) {
    if (hours < 24) return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  }
  return null;
}

export interface ServiceManagementCardProps {
  service: BusinessServiceRow;
  /** Index in list (for drag-and-drop reorder). */
  index: number;
  /** When true, show drag handle and allow drag; hide Edit/Delete row. */
  isReorderMode: boolean;
  /** Toggle on/off. */
  // eslint-disable-next-line no-unused-vars
  onToggleActive?: (serviceId: string, active: boolean) => void;
  /** Edit — no-op for now. */
  // eslint-disable-next-line no-unused-vars
  onEdit?: (service: BusinessServiceRow) => void;
  /** Delete — no-op for now. */
  // eslint-disable-next-line no-unused-vars
  onDelete?: (serviceId: string) => void;
  /** Drag start: parent stores drag index. */
  // eslint-disable-next-line no-unused-vars
  onDragStart?: (index: number) => void;
  /** Drag end: parent clears drag state. */
  onDragEnd?: () => void;
  /** Move item up (tap reorder — mobile friendly). */
  // eslint-disable-next-line no-unused-vars
  onMoveUp?: (index: number) => void;
  /** Move item down (tap reorder — mobile friendly). */
  // eslint-disable-next-line no-unused-vars
  onMoveDown?: (index: number) => void;
  /** Total number of services (to disable up on first, down on last). */
  totalCount?: number;
  /** Draggable when in reorder mode. */
  draggable?: boolean;
}

export const ServiceManagementCard: React.FC<ServiceManagementCardProps> = ({
  service,
  index,
  isReorderMode,
  onToggleActive,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  totalCount = 0,
  draggable = false,
}) => {
  const duration = formatDuration(service);
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const cardContent = (
    <>
      <div className="flex items-start gap-4">
        {/* Reorder controls — only in sort mode: drag handle (desktop) + up/down (tap, mobile-friendly) */}
        {isReorderMode && (
          <div className="flex flex-col items-center flex-shrink-0">
            {/* Up / number / down — evenly spaced; number centered in line with arrows */}
            <div className="flex flex-col items-center justify-between gap-3 sm:gap-0.5 w-[44px] sm:w-auto">
              <button
                type="button"
                onClick={() => onMoveUp?.(index)}
                disabled={isFirst}
                aria-label="Move up"
                className="flex items-center justify-center p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] w-[44px] sm:min-h-0 sm:min-w-0 sm:w-auto sm:p-1.5 sm:rounded-lg sm:text-gray-400 sm:hover:text-white sm:hover:bg-white/10"
              >
                <ChevronUpIcon className="h-5 w-5 sm:h-5 sm:w-5 flex-shrink-0" />
              </button>
              <span className="flex items-center justify-center w-[44px] sm:w-auto text-sm font-semibold text-white sm:text-[10px] sm:font-medium sm:text-gray-500 sm:uppercase sm:tracking-wider tabular-nums">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onMoveDown?.(index)}
                disabled={isLast}
                aria-label="Move down"
                className="flex items-center justify-center p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] w-[44px] sm:min-h-0 sm:min-w-0 sm:w-auto sm:p-1.5 sm:rounded-lg sm:text-gray-400 sm:hover:text-white sm:hover:bg-white/10"
              >
                <ChevronDownIcon className="h-5 w-5 sm:h-5 sm:w-5 flex-shrink-0" />
              </button>
            </div>
            {/* Drag handle — visible on desktop for mouse drag */}
            <div
              className="hidden sm:block mt-1 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
            >
              <Bars3Icon className="h-5 w-5" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header: name + price — same as public ServiceCard */}
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-black text-white tracking-tight pr-4 flex-1">
              {service.name}
            </h3>
            <div className="text-right flex-shrink-0">
              <span className="text-xl font-black text-white leading-none">
                {formatPrice(service.price_cents)}
              </span>
              {!service.is_active && (
                <span className="inline-block mt-1.5 text-[9px] bg-white/5 text-zinc-500 px-2 py-0.5 rounded border border-white/10 font-bold uppercase tracking-tight">
                  Hidden
                </span>
              )}
            </div>
          </div>

          {/* Duration — same position as public card */}
          {duration && (
            <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
              <ClockIcon className="h-3 w-3 flex-shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {duration}
              </span>
            </div>
          )}

          {/* Description — same as public ServiceCard */}
          <p className="text-zinc-500 text-sm leading-relaxed mb-4 pr-4">
            {service.description || ''}
          </p>

          {/* Action row: Edit, Delete, Switch — reference style (dark containers, icon + label) */}
          {!isReorderMode && (
            <div className="flex items-center justify-between pt-5 border-t border-white/[0.08]">
              <div className="flex gap-2 w-auto sm:w-full sm:max-w-[240px]">
                <button
                  type="button"
                  onClick={() => onEdit?.(service)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 sm:flex-1 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-medium rounded-xl sm:rounded-2xl border border-neutral-700 transition-all active:scale-95 min-w-0 cursor-pointer"
                  aria-label="Edit service"
                >
                  <PencilSquareIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(service.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-2.5 sm:flex-1 bg-neutral-800 hover:bg-red-500/10 text-white hover:text-red-400 text-sm font-medium rounded-xl sm:rounded-2xl border border-neutral-700 hover:border-red-500/30 transition-all active:scale-95 min-w-0 cursor-pointer"
                  aria-label="Delete service"
                >
                  <TrashIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-red-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </div>
              <Switch
                size="md"
                checked={service.is_active}
                onCheckedChange={checked =>
                  onToggleActive?.(service.id, checked)
                }
                aria-label={
                  service.is_active ? 'Service visible' : 'Service hidden'
                }
              />
            </div>
          )}
        </div>
      </div>
    </>
  );

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
        {cardContent}
      </div>
    </GlassCard>
  );
};
