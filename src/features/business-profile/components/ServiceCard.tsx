'use client';

import { Button, GlassCard } from '@/components/shared';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

/** Max description length before collapsing. Keeps cards uniform height on mobile. */
const DESCRIPTION_PREVIEW_LENGTH = 120;

interface Service {
  id?: string;
  name: string;
  price: string | number;
  description: string;
  hours_to_complete?: number | null;
  duration_minutes?: number | null;
}

interface ServiceCardProps {
  service: Service;
  // eslint-disable-next-line no-unused-vars
  onEdit?: (_service: Service) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete?: (_serviceId: string) => void;
  isEditable?: boolean;
  isPublic?: boolean;
  businessSlug?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  isEditable = false,
  isPublic = false,
  businessSlug = '',
}) => {
  const router = useRouter();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const description = service.description || '';
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;
  const previewText =
    isLongDescription && !isDescriptionExpanded
      ? `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH).trim()}...`
      : description;

  const effectiveHours =
    service.duration_minutes != null && service.duration_minutes > 0
      ? service.duration_minutes / 60
      : (service.hours_to_complete ?? null);

  const handleSelectClick = () => {
    if (businessSlug && service.id) {
      router.push(`/${businessSlug}/book/details?serviceId=${service.id}`);
    }
  };
  const formatPrice = (price: string | number) => {
    // If it's already a formatted string (starts with $), return as is
    if (typeof price === 'string' && price.startsWith('$')) {
      return price;
    }

    // If it's a number (price in cents), convert to dollars
    if (typeof price === 'number') {
      if (price === 0) return 'Contact for quote';
      return `$${(price / 100).toFixed(0)}`;
    }

    // If it's a string without $, try to parse it
    if (typeof price === 'string') {
      if (!price || price === '0' || price === '$0') return 'Contact for quote';
      const numericPrice = price.replace(/[^0-9]/g, '');
      return numericPrice ? `$${numericPrice}` : 'Contact for quote';
    }

    return 'Contact for quote';
  };

  const formatDuration = (hours: number | null | undefined) => {
    if (!hours) return null;
    if (hours < 24) {
      return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
    }
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  };

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      className="group"
      padding="md"
    >
      {/* Header: service name + price (thick black weight) */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-black text-white tracking-tight pr-4 flex-1">
          {service.name}
        </h3>
        <span className="text-xl font-black text-white leading-none flex-shrink-0">
          {formatPrice(service.price)}
        </span>
      </div>

      {/* Description — fixed min-height so all cards align; long text is collapsible */}
      <div className="mb-4 pr-4 min-h-[4.5rem]">
        <p
          className={`text-zinc-500 text-sm leading-relaxed ${
            isLongDescription && !isDescriptionExpanded ? 'line-clamp-3' : ''
          }`}
        >
          {previewText}
        </p>
        {isLongDescription && (
          <button
            type="button"
            onClick={() => setIsDescriptionExpanded(prev => !prev)}
            className="mt-1.5 text-xs font-medium text-zinc-400 hover:text-white active:text-white transition-colors cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] -ml-2 pl-2 flex items-center gap-1"
            aria-expanded={isDescriptionExpanded}
          >
            {isDescriptionExpanded ? (
              <>
                <ChevronUpIcon className="h-3.5 w-3.5" />
                See less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5" />
                See more
              </>
            )}
          </button>
        )}
      </div>

      {/* Faint divider + footer: duration left, Book Now right */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.03]">
        {effectiveHours ? (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <ClockIcon className="h-3 w-3 flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {formatDuration(effectiveHours)}
            </span>
          </div>
        ) : (
          <div />
        )}

        {isPublic && !isEditable && businessSlug && service.id && (
          <button
            onClick={handleSelectClick}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-100 active:bg-zinc-200 transition-colors cursor-pointer"
          >
            Select
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Edit controls */}
      {isEditable && (
        <div className="px-5 pb-5 pt-4 flex gap-2 border-t border-white/10 mt-4">
          {onEdit && (
            <Button
              onClick={() => onEdit(service)}
              variant="primary"
              size="sm"
              className="flex-1 hover:scale-105"
            >
              Edit Service
            </Button>
          )}
          {onDelete && service.id && (
            <Button
              onClick={() => onDelete(service.id!)}
              variant="danger"
              size="sm"
              className="flex-1 hover:scale-105"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
};
