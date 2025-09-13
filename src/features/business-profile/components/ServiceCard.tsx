import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface Service {
  id?: string;
  name: string;
  price: string;
  description: string;
  hours_to_complete?: number;
}

interface ServiceCardProps {
  service: Service;
  onEdit?: (service: Service) => void;
  onDelete?: (serviceId: string) => void;
  isEditable?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  isEditable = false,
}) => {
  const formatPrice = (price: string) => {
    if (!price) return 'Contact for quote';
    const numericPrice = price.replace(/[^0-9]/g, '');
    return numericPrice ? `$${numericPrice}` : 'Contact for quote';
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 p-6 rounded-xl shadow-md transition-colors duration-300 hover:bg-neutral-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-50 mb-2">
            {service.name}
          </h3>
          {service.hours_to_complete && (
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>
                {service.hours_to_complete} hour
                {service.hours_to_complete !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center px-3 py-1 bg-neutral-700 rounded-full">
          <p className="text-lg font-bold text-gray-50">
            {formatPrice(service.price)}
          </p>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          {service.description}
        </p>
      )}

      {isEditable && (
        <div className="flex gap-2 pt-2 border-t border-neutral-600">
          {onEdit && (
            <button
              onClick={() => onEdit(service)}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && service.id && (
            <button
              onClick={() => onDelete(service.id!)}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
