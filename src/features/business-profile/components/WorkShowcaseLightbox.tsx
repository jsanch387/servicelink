'use client';

import { ImageWithFallback } from '@/components/shared';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface WorkShowcaseLightboxImage {
  id: string;
  src: string;
  alt: string;
  thumbSrc?: string;
}

interface WorkShowcaseLightboxProps {
  images: WorkShowcaseLightboxImage[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
  countLabel: (current: number, total: number) => string;
}

export function WorkShowcaseLightbox({
  images,
  index,
  onClose,
  onIndexChange,
  closeLabel,
  previousLabel,
  nextLabel,
  countLabel,
}: WorkShowcaseLightboxProps) {
  const image = images[index];
  const touchStartX = useRef<number | null>(null);
  const filmstripRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (images.length < 2) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onIndexChange((index - 1 + images.length) % images.length);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onIndexChange((index + 1) % images.length);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [images.length, index, onClose, onIndexChange]);

  useEffect(() => {
    filmstripRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [index]);

  if (!image || typeof document === 'undefined') return null;

  const showNav = images.length > 1;

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!showNav || touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX == null) return;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    onIndexChange(
      delta > 0
        ? (index - 1 + images.length) % images.length
        : (index + 1) % images.length
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5"
        onClick={event => event.stopPropagation()}
      >
        <p className="rounded-full bg-white/10 px-3 py-1 text-[13px] font-medium tabular-nums text-white/80 backdrop-blur-md">
          {countLabel(index + 1, images.length)}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
          aria-label={closeLabel}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={event => event.stopPropagation()}
      >
        {showNav ? (
          <button
            type="button"
            onClick={() =>
              onIndexChange((index - 1 + images.length) % images.length)
            }
            className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 sm:inline-flex"
            aria-label={previousLabel}
          >
            <ChevronLeftIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        <div className="relative flex h-full w-full max-w-5xl items-center justify-center">
          <ImageWithFallback
            key={image.id}
            src={image.src}
            alt={image.alt}
            width={1600}
            height={1600}
            className="max-h-[72dvh] w-auto max-w-full rounded-lg object-contain sm:rounded-2xl"
            fallbackLabel="WORK"
            fallbackSize={{ w: 1600, h: 1600 }}
            sizes="100vw"
            priority
          />
        </div>

        {showNav ? (
          <button
            type="button"
            onClick={() =>
              onIndexChange((index + 1) % images.length)
            }
            className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 sm:inline-flex"
            aria-label={nextLabel}
          >
            <ChevronRightIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {showNav ? (
        <div
          className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-5"
          onClick={event => event.stopPropagation()}
        >
          <div className="flex justify-center gap-1.5 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((thumb, thumbIndex) => {
              const selected = thumbIndex === index;
              return (
                <button
                  key={thumb.id}
                  type="button"
                  ref={node => {
                    filmstripRefs.current[thumbIndex] = node;
                  }}
                  onClick={() => onIndexChange(thumbIndex)}
                  className={`relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-[10px] transition-opacity ${
                    selected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                      : 'opacity-45 hover:opacity-80'
                  }`}
                  aria-label={thumb.alt}
                  aria-current={selected ? 'true' : undefined}
                >
                  <ImageWithFallback
                    src={thumb.thumbSrc || thumb.src}
                    retrySrc={thumb.src}
                    alt=""
                    width={88}
                    height={88}
                    className="h-full w-full object-cover"
                    fallbackLabel=""
                    fallbackSize={{ w: 88, h: 88 }}
                    sizes="44px"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pb-[max(1rem,env(safe-area-inset-bottom))]" />
      )}
    </div>,
    document.body
  );
}
