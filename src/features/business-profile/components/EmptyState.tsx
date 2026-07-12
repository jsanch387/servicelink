import React from 'react';
import {
  PhotoIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/shared/Button';

interface EmptyStateProps {
  type: 'images' | 'services' | 'bio' | 'contact';
  onEdit?: () => void;
  showEditButton?: boolean;
  /** Override default owner-facing title (e.g. public gallery empty state). */
  title?: string;
  /** Override default owner-facing description. */
  description?: string;
}

const emptyStateConfig = {
  images: {
    icon: PhotoIcon,
    title: 'No images available',
    description:
      'Add some photos to showcase your work and attract more customers.',
    actionText: 'Add Images',
  },
  services: {
    icon: PlusIcon,
    title: 'No services listed',
    description:
      'Add your services and pricing to let customers know what you offer.',
    actionText: 'Add Services',
  },
  bio: {
    icon: ExclamationTriangleIcon,
    title: 'No description available',
    description: 'Add a description to tell customers about your business.',
    actionText: 'Add Description',
  },
  contact: {
    icon: ExclamationTriangleIcon,
    title: 'No contact information',
    description: 'Add contact details so customers can reach you.',
    actionText: 'Add Contact Info',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onEdit,
  showEditButton = true,
  title,
  description,
}) => {
  const config = emptyStateConfig[type];
  const IconComponent = config.icon;
  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;

  return (
    <div className="text-center py-8 px-4">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-neutral-700 mb-4">
        <IconComponent className="h-8 w-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-medium text-white mb-2">{displayTitle}</h3>

      <p className="text-gray-400 mb-4 max-w-sm mx-auto">
        {displayDescription}
      </p>

      {showEditButton && onEdit && (
        <Button
          onClick={onEdit}
          variant="primary"
          className="inline-flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>{config.actionText}</span>
        </Button>
      )}
    </div>
  );
};
