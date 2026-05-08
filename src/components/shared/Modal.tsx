'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** When true, modal takes full screen height on mobile for better preview space. */
  fullScreenMobile?: boolean;
  /** Merged onto the modal panel (below the overlay). Use for desktop-only polish. */
  panelClassName?: string;
  /** Merged onto the scrollable content wrapper around `children`. */
  contentClassName?: string;
  /** Merged onto the fixed title row. */
  headerClassName?: string;
  /** Merged onto the `<h3>` title element. */
  titleClassName?: string;
  /**
   * When true, header and content use 16px horizontal padding at sm+ (overrides
   * wider sm:px-6 / md:px-8). Mobile stays px-4.
   */
  uniformHorizontalPadding16?: boolean;
  /** When true, tapping the overlay does not dismiss (e.g. during async submit). */
  preventClose?: boolean;
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
  fullScreenMobile = false,
  panelClassName = '',
  contentClassName = '',
  headerClassName = '',
  titleClassName = '',
  uniformHorizontalPadding16 = false,
  preventClose = false,
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

  /** While `preventClose` (e.g. async submit), block Escape so the sheet cannot dismiss mid-flight. */
  useEffect(() => {
    if (!isOpen || !preventClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, preventClose]);

  // Prevent scroll on overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (preventClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent scroll propagation
  const handleContentScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const headerPaddingClass = uniformHorizontalPadding16
    ? 'px-4 py-4 sm:px-4 sm:py-4'
    : 'p-4 sm:p-6';
  const contentHorizontalClass = uniformHorizontalPadding16
    ? 'px-4 sm:px-4 md:px-4'
    : 'px-4 sm:px-6 md:px-8';

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
        className={`bg-[var(--dashboard-bg)] border border-white/10 ${
          fullScreenMobile
            ? 'rounded-none h-full sm:rounded-3xl sm:h-auto'
            : 'rounded-t-3xl sm:rounded-3xl'
        } w-full min-w-0 ${maxWidthClasses[maxWidth]} mx-auto ${
          fullScreenMobile ? 'max-h-screen' : 'max-h-[95vh] sm:max-h-[90vh]'
        } flex flex-col shadow-2xl relative overflow-hidden transform transition-all duration-300 ease-out ${panelClassName}`}
        style={{
          transform: 'translateY(0)',
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fixed Header: title only (close via Cancel button or overlay) */}
        {title && (
          <div
            className={`flex min-w-0 items-center border-b border-white/10 flex-shrink-0 ${headerPaddingClass} ${headerClassName}`}
          >
            <h3
              className={`text-lg font-semibold text-white min-w-0 ${titleClassName}`}
            >
              {title}
            </h3>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-6 pb-6 sm:pt-8 sm:pb-8 ${contentHorizontalClass} ${contentClassName}`}
          onWheel={handleContentScroll}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
