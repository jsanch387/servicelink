'use client';

import { GlassCard, Switch } from '@/components/shared';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { ServiceRow } from '@/features/services/types/services';
import {
  Bars3Icon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

function formatPrice(priceCents: number | null): string {
  if (priceCents == null) return 'Contact for quote';
  if (priceCents === 0) return 'Contact for quote';
  return `$${(priceCents / 100).toFixed(0)}`;
}

function formatDuration(service: ServiceRow): string | null {
  const minutes = service.duration_minutes;
  const hours = service.hours_to_complete;
  let totalMin: number | null = null;
  if (minutes != null && minutes > 0) totalMin = minutes;
  else if (hours != null && hours > 0) totalMin = Math.round(hours * 60);

  if (totalMin == null || totalMin <= 0) return null;
  return formatDurationMinutes(totalMin);
}

export interface ServiceManagementCardProps {
  service: ServiceRow;
  /** Index in list (for drag-and-drop reorder). */
  index: number;
  /** When true, show drag handle and allow drag; hide Edit/Delete row. */
  isReorderMode: boolean;
  /** Toggle on/off. */

  onToggleActive?: (serviceId: string, active: boolean) => void;
  /** Edit — deprecated; Edit button links to service edit page. */

  onEdit?: (service: ServiceRow) => void;
  /** Delete — no-op for now. */

  onDelete?: (serviceId: string) => void;
  /** Drag start: parent stores drag index. */

  onDragStart?: (index: number) => void;
  /** Drag end: parent clears drag state. */
  onDragEnd?: () => void;
  /** Move item up (tap reorder — mobile friendly). */

  onMoveUp?: (index: number) => void;
  /** Move item down (tap reorder — mobile friendly). */

  onMoveDown?: (index: number) => void;
  /** Total number of services (to disable up on first, down on last). */
  totalCount?: number;
  /** Draggable when in reorder mode. */
  draggable?: boolean;
  /** Number of add-ons assigned to this service (quick glance). */
  addOnCount?: number;
  /** Category label shown on the card when not grouped by section. */
  categoryName?: string | null;
}

export const ServiceManagementCard: React.FC<ServiceManagementCardProps> = ({
  service,
  index,
  isReorderMode,
  onToggleActive,
  onDelete,
  onDragStart,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  totalCount = 0,
  draggable = false,
  addOnCount,
  categoryName,
}) => {
  const duration = formatDuration(service);
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  const cardContent = (
    <>
      <div className="flex items-start gap-3 sm:gap-4">
        {isReorderMode && (
          <div className="flex flex-col items-center flex-shrink-0">
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
                <ChevronDownIcon className="h-5 w-5 sm:h-5 sm:w-5 flex-shrink-0" />
              </button>
            </div>
            <div
              className="hidden sm:block mt-1 p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
            >
              <Bars3Icon className="h-5 w-5" />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-3 min-w-0">
            <div className="min-w-0 flex-1">
              {categoryName ? (
                <span className="inline-block mb-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
                  {categoryName}
                </span>
              ) : null}
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                {service.name}
              </h3>
              {(duration || (addOnCount != null && addOnCount > 0)) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                  {duration ? (
                    <div className="flex items-center gap-1 text-zinc-500">
                      <ClockIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="text-[10px] font-medium tracking-wide">
                        {duration}
                      </span>
                    </div>
                  ) : null}
                  {duration && addOnCount != null && addOnCount > 0 ? (
                    <span className="text-zinc-500 text-[10px]" aria-hidden>
                      ·
                    </span>
                  ) : null}
                  {addOnCount != null && addOnCount > 0 ? (
                    <span className="text-[10px] font-medium tracking-wide text-zinc-500">
                      {addOnCount} add-on{addOnCount === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {service.price_options_enabled === true &&
              service.price_cents != null &&
              service.price_cents > 0 ? (
                <span className="block text-[10px] font-medium text-zinc-400 mb-0.5 leading-none">
                  Starting at
                </span>
              ) : null}
              <span className="text-lg sm:text-xl font-black text-white leading-none tabular-nums">
                {formatPrice(service.price_cents)}
              </span>
            </div>
          </div>

          {!isReorderMode && (
            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-white/[0.06]">
              <div className="flex gap-2 w-auto sm:w-full sm:max-w-[240px]">
                <Link
                  href={`/dashboard/services/${service.id}`}
                  className="flex items-center justify-center gap-2 min-w-[80px] sm:min-w-0 px-4 py-2 sm:px-5 sm:py-2.5 sm:flex-1 text-white text-sm font-medium rounded-xl sm:rounded-2xl border border-white/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all active:scale-95 cursor-pointer"
                  aria-label="Edit service"
                >
                  <PencilSquareIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="hidden sm:inline">Edit</span>
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete?.(service.id)}
                  className="flex items-center justify-center gap-2 min-w-[80px] sm:min-w-0 px-4 py-2 sm:px-5 sm:py-2.5 sm:flex-1 text-white text-sm font-medium rounded-xl sm:rounded-2xl border border-white/20 hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400 transition-all active:scale-95 cursor-pointer"
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
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        !service.is_active ? 'opacity-70' : ''
      }`}
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
