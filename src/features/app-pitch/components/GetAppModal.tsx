'use client';

import { Button } from '@/components/shared';
import { Modal } from '@/components/shared/Modal';
import { GET_APP_URL } from '@/constants/getApp';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { API_ROUTES } from '@/constants/routes';
import { useHandheld } from '@/libs/device/useHandheld';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

import { storeUrlForBrowser } from '../storeUrl';
import { StoreBadges } from './StoreBadges';

interface GetAppModalProps {
  open: boolean;
  onClose: () => void;
}

export function GetAppModal({ open, onClose }: GetAppModalProps) {
  const handheld = useHandheld();
  if (!open || handheld == null) return null;

  const dismiss = () => {
    onClose();
    void fetch(API_ROUTES.MARK_APP_PITCH_DISMISSED, { method: 'POST' });
  };

  const openStore = () => {
    window.location.assign(
      storeUrlForBrowser(navigator.userAgent, navigator.maxTouchPoints)
    );
  };

  return (
    <Modal
      isOpen
      onClose={dismiss}
      title="Run your business from your pocket"
      presentation="center"
      bare
      preventClose
      showCloseButton={false}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute right-2 top-2 z-10 flex h-11 w-11 cursor-pointer items-center justify-center"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/70">
          <XMarkIcon className="h-4 w-4" aria-hidden />
        </span>
      </button>
      {handheld ? (
        <div className="px-5 pb-5 pt-4">
          <div className="relative mx-auto h-[280px] w-[220px] overflow-hidden [container-type:inline-size]">
            <Image
              src={MARKETING_IMAGES.features.homeScreen}
              alt=""
              width={1284}
              height={2778}
              className="absolute left-[-12.6%] top-[-32.3cqw] h-auto w-[125.3%] max-w-none"
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#141414] to-transparent"
              aria-hidden
            />
          </div>
          <h2 className="mt-4 text-center text-xl font-semibold tracking-tight text-white">
            Run your business from your pocket
          </h2>
          <p className="mt-1 text-center text-sm text-white/60">
            New bookings show up on your phone.
          </p>
          <div className="mt-5">
            <Button fullWidth size="md" onClick={openStore}>
              Get the app
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center px-5 pb-5 pt-6">
          <h2 className="w-full text-lg font-semibold tracking-tight text-white">
            Run your business from your pocket
          </h2>
          <p className="mt-1 w-full text-sm text-white/60">
            Scan with your phone camera.
          </p>
          <div className="mt-4 rounded-[16px] bg-white p-3">
            <QRCodeSVG
              value={GET_APP_URL}
              size={148}
              level="M"
              aria-label="QR code to download the ServiceLink app"
            />
          </div>
          <div className="mt-4">
            <StoreBadges />
          </div>
        </div>
      )}
    </Modal>
  );
}
