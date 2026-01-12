import { Button } from '@/components/shared';
import { ClockIcon } from '@heroicons/react/24/outline';
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
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  isEditable = false,
}) => {
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
    <div className="bg-neutral-800 rounded-2xl border border-neutral-700">
      <div className="p-5">
        {/* Header with Title and Price */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-white pr-4 flex-1">
            {service.name}
          </h3>
          <span className="text-xl font-bold text-white flex-shrink-0">
            {formatPrice(service.price)}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
          {service.description}
        </p>

        {/* Duration - Pill Design */}
        {service.hours_to_complete && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-700/50 rounded-full text-gray-400">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm">{formatDuration(service.hours_to_complete)}</span>
          </div>
        )}
      </div>

      {/* Edit controls */}
      {isEditable && (
        <div className="px-5 pb-5 pt-4 flex gap-2 border-t border-neutral-700 mt-4">
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
