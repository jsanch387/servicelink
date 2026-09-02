'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WorkPhoto } from '../../utils/workPhotoSrc';

interface WorkPhotoLightboxProps {
  photos: WorkPhoto[];
  openIndex: number | null;
  onClose: () => void;
  businessName?: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const WorkPhotoLightbox: React.FC<WorkPhotoLightboxProps> = ({
  photos,
  openIndex,
  onClose,
  businessName,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const titleId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const ignoreScrollRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isOpen = openIndex !== null && photos.length > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior) => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = Math.max(0, Math.min(index, photos.length - 1));
      ignoreScrollRef.current = true;
      el.scrollTo({ left: next * el.clientWidth, behavior });
      setActiveIndex(next);
      window.requestAnimationFrame(() => {
        ignoreScrollRef.current = false;
      });
    },
    [photos.length]
  );

  useEffect(() => {
    if (!isOpen || openIndex === null) return;
    const next = Math.max(0, Math.min(openIndex, photos.length - 1));
    setActiveIndex(next);
    ignoreScrollRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (el) {
        el.scrollLeft = next * el.clientWidth;
      }
      closeRef.current?.focus();
      window.requestAnimationFrame(() => {
        ignoreScrollRef.current = false;
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, openIndex, photos.length]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollToIndex(activeIndex - 1, 'smooth');
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollToIndex(activeIndex + 1, 'smooth');
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen, onClose, scrollToIndex, activeIndex]);

  const handleScroll = () => {
    if (ignoreScrollRef.current) return;
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== activeIndex) setActiveIndex(next);
  };

  if (!isOpen || !mounted) return null;

  const altName = businessName?.trim() || 'Business';

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
      <div
        className="relative z-10 flex items-center justify-between gap-3 px-3 pt-3 sm:px-5 sm:pt-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <p id={titleId} className="min-w-0 text-sm font-medium text-white/90">
          {ui.profile.lightboxPhotoPosition(activeIndex + 1, photos.length)}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20"
          aria-label={ui.profile.lightboxClose}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1, 'smooth')}
              disabled={activeIndex === 0}
              className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex"
              aria-label={ui.profile.lightboxPrevious}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1, 'smooth')}
              disabled={activeIndex === photos.length - 1}
              className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30 sm:inline-flex"
              aria-label={ui.profile.lightboxNext}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </>
        ) : null}

        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="flex h-full w-full min-w-full shrink-0 snap-center items-center justify-center px-3 sm:px-16"
            >
              {Math.abs(index - activeIndex) <= 1 ? (
                <ImageWithFallback
                  src={photo.src}
                  alt={ui.profile.workPhotoAlt(
                    altName,
                    index + 1,
                    photos.length
                  )}
                  width={1200}
                  height={1200}
                  className="max-h-[min(80dvh,720px)] w-auto max-w-full object-contain"
                  fallbackLabel="WORK"
                  fallbackSize={{ w: 1200, h: 1200 }}
                  sizes="100vw"
                  priority={index === activeIndex}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {photos.length > 1 ? (
        <div
          className="relative z-10 flex justify-center gap-1.5 px-4 py-4"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => scrollToIndex(index, 'smooth')}
              className={`h-1.5 cursor-pointer rounded-full transition-all ${
                index === activeIndex
                  ? 'w-5 bg-white'
                  : 'w-1.5 bg-white/35 hover:bg-white/60'
              }`}
              aria-label={ui.profile.lightboxPhotoPosition(
                index + 1,
                photos.length
              )}
              aria-current={index === activeIndex ? 'true' : undefined}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        />
      )}
    </div>,
    document.body
  );
};
