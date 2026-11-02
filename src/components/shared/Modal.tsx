'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

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
  /**
   * `sheet` — bottom sheet on all screen sizes (slides up from bottom).
   * `default` — centered dialog from sm breakpoint up.
   */
  presentation?: 'default' | 'sheet';
  /** Overrides the default panel max-height classes when set. */
  panelMaxHeightClass?: string;
  /** Shows an X in the header that calls `onClose`. Hidden while `preventClose`. */
  showCloseButton?: boolean;
  closeAriaLabel?: string;
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
  presentation = 'default',
  panelMaxHeightClass,
  showCloseButton = true,
  closeAriaLabel = 'Close',
}) => {
  const isSheet = presentation === 'sheet';
  const [mounted, setMounted] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (!preventClose) onClose();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, preventClose, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (preventClose) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContentScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  if (!isOpen || !mounted) return null;

  const headerPaddingClass = uniformHorizontalPadding16
    ? 'px-4 py-3.5 sm:px-4 sm:py-3.5'
    : 'px-4 py-3.5 sm:px-6 sm:py-4';
  const contentHorizontalClass = uniformHorizontalPadding16
    ? 'px-4 sm:px-4 md:px-4'
    : 'px-4 sm:px-6 md:px-8';

  const maxWidthClasses = {
    sm: 'max-w-full sm:max-w-sm',
    md: 'max-w-full sm:max-w-md',
    lg: 'max-w-full sm:max-w-lg',
    xl: 'max-w-full sm:max-w-xl',
    '2xl': 'max-w-full sm:max-w-2xl',
  };

  const overlayAlignClass = isSheet
    ? 'items-end justify-center p-0'
    : 'items-end sm:items-center justify-center p-0 sm:p-6';

  const panelRoundedClass = fullScreenMobile
    ? 'rounded-none h-full sm:rounded-2xl sm:h-auto'
    : isSheet
      ? 'rounded-t-[1.5rem]'
      : 'rounded-t-[1.5rem] sm:rounded-2xl';

  const resolvedPanelMaxHeightClass =
    panelMaxHeightClass ??
    (fullScreenMobile
      ? 'max-h-screen'
      : isSheet
        ? 'max-h-[min(420px,85dvh)] sm:max-h-[min(480px,90dvh)]'
        : 'max-h-[95vh] sm:max-h-[90vh]');

  const overlay = (
    <div
      className={`fixed inset-0 z-[100] flex ${overlayAlignClass} bg-black/65 backdrop-blur-md overscroll-none`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      style={{
        animation: 'fadeIn 0.22s ease-out',
      }}
      onClick={handleOverlayClick}
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className={`relative flex w-full min-w-0 ${maxWidthClasses[maxWidth]} ${resolvedPanelMaxHeightClass} ${panelRoundedClass} mx-auto flex-col overflow-hidden border border-white/[0.08] bg-[#141414] shadow-[0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-inset ring-white/[0.04] ${panelClassName}`}
        style={{
          animation: 'slideUp 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title ? (
          <div
            className={`flex min-w-0 flex-shrink-0 items-center gap-3 ${headerPaddingClass} ${headerClassName}`}
          >
            <h3
              id={titleId}
              className={`min-w-0 flex-1 text-base font-semibold tracking-tight text-white sm:text-lg ${titleClassName}`}
            >
              {title}
            </h3>
            {showCloseButton && !preventClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeAriaLabel}
                className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.06] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}

        {title ? <div className="h-px flex-shrink-0 bg-white/[0.06]" /> : null}

        <div
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-dark pt-5 pb-6 sm:pt-6 sm:pb-7 ${contentHorizontalClass} ${contentClassName}`}
          onWheel={handleContentScroll}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
};
