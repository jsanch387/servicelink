'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect } from 'react';

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
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // Restore scroll position when modal closes
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Prevent scroll on overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent scroll propagation
  const handleContentScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm overscroll-none transition-opacity duration-300"
      style={{
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={handleOverlayClick}
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => {
        // Only allow scrolling if it's within the modal content
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className={`bg-white/3 border border-white/8 backdrop-blur-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full ${maxWidthClasses[maxWidth]} mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden transform transition-all duration-300 ease-out`}
        style={{
          transform: 'translateY(0)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button - Always visible */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 sm:right-6 sm:top-6 w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white active:bg-white/10 transition-colors z-10 flex-shrink-0 touch-manipulation"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-6 h-6 sm:w-5 sm:h-5" />
        </button>

        {/* Fixed Header - Only show if title provided */}
        {title && (
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutral-700 flex-shrink-0">
            <h3 className="text-lg sm:text-xl font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
              {title}
            </h3>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto overscroll-contain pt-6 pb-6 px-4 sm:pt-8 sm:px-6 md:px-8 sm:pb-8 flex-1"
          onWheel={handleContentScroll}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
