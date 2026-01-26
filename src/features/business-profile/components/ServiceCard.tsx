'use client';

import { Button } from '@/components/shared';
import { ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React from 'react';

interface Service {
  id?: string;
  name: string;
  price: string | number;
  description: string;
  hours_to_complete?: number | null;
}

interface ServiceCardProps {
  service: Service;
  onEdit?: (_service: Service) => void;
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

  const handleBookClick = () => {
    if (businessSlug) {
      router.push(
        `/${businessSlug}/book?service=${encodeURIComponent(service.name)}`
      );
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
    <div className="group relative bg-[#1c1c1e] border border-white/[0.08] rounded-3xl p-5 transition-all duration-300 hover:border-orange-500/30 hover:bg-[#242426]">
      {/* Header Row */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[19px] font-bold text-white tracking-tight pr-4 flex-1">
          {service.name}
        </h3>
        <span className="text-[20px] font-black text-white flex-shrink-0">
          {formatPrice(service.price)}
        </span>
      </div>

      {/* Description */}
      <p className="text-[#989899] text-[14px] leading-relaxed mb-6 pr-4">
        {service.description}
      </p>

      {/* Footer Row */}
      <div className="flex items-center justify-between mt-auto">
        {/* Duration - Pill Design */}
        {service.hours_to_complete ? (
          <div className="flex items-center gap-2 bg-white/[0.05] px-3 py-1.5 rounded-full border border-white/[0.05]">
            <ClockIcon className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[12px] font-semibold text-zinc-300 tracking-wide">
              {formatDuration(service.hours_to_complete)}
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Book Button - Only show on public profiles */}
        {isPublic && !isEditable && businessSlug && (
          <button
            onClick={handleBookClick}
            className="flex items-center gap-1 group/btn"
          >
            <span className="text-orange-500 font-bold text-[15px] tracking-tight group-hover/btn:mr-1 transition-all">
              Book Now
            </span>
            <ChevronRightIcon className="h-[18px] w-[18px] text-orange-500" />
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
    </div>
  );
};
