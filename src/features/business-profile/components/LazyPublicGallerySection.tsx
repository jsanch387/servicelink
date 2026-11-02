'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CompleteBusinessProfile } from '../types/businessProfile';
import { getPublicProfileGalleryApiPath } from '../utils/getPublicProfileGalleryApiPath';
import { PublicProfileTabPanelSkeleton } from './PublicProfileTabPanelSkeleton';
import { WorkShowcase } from './WorkShowcase';

type PublicGalleryImage = CompleteBusinessProfile['images'][number];

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface LazyPublicGallerySectionProps {
  businessSlug: string;
  businessProfile: CompleteBusinessProfile;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Fetch when the Gallery tab is active. */
  isActive: boolean;
}

const noopSave = async () => {};
const noopCancel = () => {};

export const LazyPublicGallerySection: React.FC<
  LazyPublicGallerySectionProps
> = ({ businessSlug, businessProfile, bookingFlowLocale = 'en', isActive }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [images, setImages] = useState<PublicGalleryImage[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');

  const fetchGallery = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch(getPublicProfileGalleryApiPath(businessSlug), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { images?: PublicGalleryImage[] };
        error?: string;
      };

      if (!res.ok || !json.success || !json.data?.images) {
        setLoadState('error');
        return;
      }

      setImages(json.data.images);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [businessSlug]);

  useEffect(() => {
    if (!isActive) return;
    if (images || loadState === 'loading') return;
    if (loadState === 'ready' || loadState === 'error') return;
    void fetchGallery();
  }, [isActive, images, loadState, fetchGallery]);

  const galleryProfile = useMemo(
    () =>
      ({
        ...businessProfile,
        images: images ?? [],
      }) as CompleteBusinessProfile,
    [businessProfile, images]
  );

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <PublicProfileTabPanelSkeleton
        variant="gallery"
        ariaLabel={ui.profile.galleryLoadingAriaLabel}
      />
    );
  }

  if (loadState === 'error') {
    return (
      <div className="px-4 py-8 text-center sm:px-8">
        <p className="text-sm text-zinc-500">{ui.profile.galleryLoadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoadState('idle');
            void fetchGallery();
          }}
          className="mt-3 cursor-pointer text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline touch-manipulation"
        >
          {ui.profile.galleryRetry}
        </button>
      </div>
    );
  }

  return (
    <WorkShowcase
      businessProfile={galleryProfile}
      editMode="view"
      onSave={noopSave}
      onCancel={noopCancel}
      isPublic
      bookingFlowLocale={bookingFlowLocale}
    />
  );
};
