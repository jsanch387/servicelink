/* eslint-disable no-unused-vars */
'use client';

import { Button, Modal } from '@/components/shared';
import {
  ArrowDownTrayIcon,
  ShareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';
import { useStoryPostImage } from '../hooks/useStoryPostImage';
import { StoryPostPreview } from './StoryPostPreview';

interface StoryPostShareButtonProps {
  businessName: string;
  logoUrl: string;
  bookingUrl: string;
}

export const StoryPostShareButton: React.FC<StoryPostShareButtonProps> = ({
  businessName,
  logoUrl,
  bookingUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobileUi, setIsMobileUi] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const { generateImage, isGenerating } = useStoryPostImage();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nav: Navigator & { userAgent?: string } = navigator as any;
    const ua = nav.userAgent || '';
    const mobile =
      /iPhone|iPad|iPod|Android|Mobile/i.test(ua) ||
      ('ontouchstart' in window && window.innerWidth < 900);
    setIsMobileUi(mobile);
  }, []);

  // Pre-generate the story image as soon as required data is available
  useEffect(() => {
    if (!logoUrl || !bookingUrl || !businessName) return;
    void ensureImageGenerated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, logoUrl, bookingUrl]);

  const ensureImageGenerated = async () => {
    const node = exportRef.current;
    if (!node) return null;

    const dataUrl = await generateImage(node);
    if (dataUrl) {
      setImageUrl(dataUrl);
    }
    return dataUrl;
  };

  const handlePrimaryClick = () => {
    setIsOpen(true);
  };

  const handleDownloadClick = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const dataUrl = await ensureImageGenerated();
    if (!dataUrl) {
      setIsDownloading(false);
      return;
    }

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'servicelink-story.png', {
      type: 'image/png',
    });

    const nav = navigator as Navigator & {
      canShare?: (_shareData: { files: File[] }) => boolean;
      share?: (_shareData: {
        files?: File[];
        title?: string;
        text?: string;
      }) => Promise<void>;
      userAgent?: string;
    };

    const ua = nav.userAgent || '';
    const isLikelyMobile =
      /iPhone|iPad|iPod|Android|Mobile/i.test(ua) ||
      ('ontouchstart' in window && window.innerWidth < 900);

    const canShareFile = !!nav.canShare && nav.canShare({ files: [file] });

    // Mobile: prefer native share sheet; if not supported, open image directly
    if (isLikelyMobile) {
      if (canShareFile && nav.share) {
        try {
          await nav.share({
            files: [file],
            title: `${businessName} on ServiceLink`,
            text: `Book with ${businessName} today: ${bookingUrl}`,
          });
          setIsDownloading(false);
          return;
        } catch {
          // fall through and try direct open below
        }
      }

      // Fallback for older iOS Safari: navigate to image so user can long-press "Save Image"
      window.location.href = dataUrl;
      setIsDownloading(false);
      return;
    }

    // Desktop or non-mobile: force a normal file download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'servicelink-story.png';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setIsDownloading(false);
  };

  return (
    <>
      <Button
        type="button"
        onClick={handlePrimaryClick}
        variant="ghost"
        className="h-8 px-2.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
        icon={<ShareIcon className="h-3.5 w-3.5" />}
        iconPosition="left"
      >
        Share
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title=""
        maxWidth="lg"
        fullScreenMobile
      >
        <div className="space-y-5">
          {/* Compact, organized header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-white tracking-[0.18em] uppercase">
                Story preview
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                {isMobileUi
                  ? 'Press and hold the image to save it to your photos or share it.'
                  : 'Click the arrow to download this image and post it wherever you like.'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isMobileUi && (
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  disabled={isGenerating || isDownloading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-gray-100 hover:bg-white/10 transition"
                  aria-label="Download story image"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-gray-300 hover:bg-white/10 transition"
                aria-label="Close preview"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="w-full flex justify-center pt-1">
            {/* Preview the flattened PNG so mobile users can long-press to save */}
            <div className="relative shadow-2xl rounded-[2.2rem] overflow-hidden border border-white/10 bg-black/60 flex items-center justify-center w-full max-w-[360px] aspect-[9/16]">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Story preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-gray-500">Preparing preview…</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Hidden-but-rendered export canvas at full resolution for image generation */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none">
        <StoryPostPreview
          ref={exportRef}
          businessName={businessName}
          logoUrl={logoUrl}
          bookingUrl={bookingUrl}
        />
      </div>
    </>
  );
};
