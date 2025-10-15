'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Modal Component
 *
 * Mobile-friendly modal with scrolling support.
 * Features a fixed header and scrollable content area.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
}) => {
  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div
        className={`bg-neutral-800 border-2 border-neutral-700 rounded-2xl sm:rounded-3xl w-full ${maxWidthClasses[maxWidth]} mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col`}
      >
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutral-700 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-neutral-700 rounded-lg flex-shrink-0"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
};
