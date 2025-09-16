import React from 'react';

interface Service {
  id?: string;
  name: string;
  price: string | number;
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

  return (
    <div className="bg-neutral-800 p-6 sm:p-8 rounded-2xl border border-neutral-700 w-full sm:w-64 h-auto sm:h-[24rem] flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
        <p 
          className="text-gray-400 text-sm mb-6 overflow-hidden max-h-16 sm:max-h-24"
        >
          {service.description}
        </p>
      </div>
      
      {/* Price and Hours are aligned at the bottom */}
      <div className="flex flex-col items-start space-y-2 mt-auto">
        <div className="flex items-center">
          <span className="text-3xl font-extrabold text-orange-500">
            {formatPrice(service.price)}
          </span>
          <span className="text-gray-400 text-sm ml-2">base price</span>
        </div>
        {service.hours_to_complete && (
          <div className="flex items-center">
            <span className="text-xl text-gray-400 font-semibold">{service.hours_to_complete}</span>
            <span className="text-gray-500 text-xs ml-1">hrs</span>
          </div>
        )}
      </div>

      {/* Edit controls */}
      {isEditable && (
        <div className="flex gap-2 pt-4 mt-4 border-t border-neutral-700">
          {onEdit && (
            <button
              onClick={() => onEdit(service)}
              className="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-105 font-medium"
            >
              Edit Service
            </button>
          )}
          {onDelete && service.id && (
            <button
              onClick={() => onDelete(service.id!)}
              className="flex-1 px-3 py-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:scale-105 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};
