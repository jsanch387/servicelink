'use client';

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

  // Full width on mobile; apply max-width from sm breakpoint up (matches edit modal)
  const maxWidthClasses = {
    sm: 'max-w-full sm:max-w-sm',
    md: 'max-w-full sm:max-w-md',
    lg: 'max-w-full sm:max-w-lg',
    xl: 'max-w-full sm:max-w-xl',
    '2xl': 'max-w-full sm:max-w-2xl',
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
        className={`bg-[var(--dashboard-bg)] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full ${maxWidthClasses[maxWidth]} mx-auto max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden transform transition-all duration-300 ease-out`}
        style={{
          transform: 'translateY(0)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header: title only (close via Cancel button or overlay) */}
        {title && (
          <div className="flex items-center p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white min-w-0">
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
