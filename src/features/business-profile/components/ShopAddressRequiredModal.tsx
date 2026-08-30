'use client';

import { Button, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { shopAddressSessionSkipKey } from '@/features/business-profile/constants/shopAddressPrompt';
import { MapPinIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

interface ShopAddressRequiredModalProps {
  businessProfileId: string;
  needsShopAddressUpdate: boolean;
  /** When true, the service-area prompt is showing — wait so we do not stack. */
  serviceAreaPromptOpen: boolean;
}

export function ShopAddressRequiredModal({
  businessProfileId,
  needsShopAddressUpdate,
  serviceAreaPromptOpen,
}: ShopAddressRequiredModalProps) {
  const shopSkipKey = shopAddressSessionSkipKey(businessProfileId);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!needsShopAddressUpdate || serviceAreaPromptOpen) {
      setIsOpen(false);
      return;
    }

    if (window.sessionStorage.getItem(shopSkipKey) === '1') {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
  }, [needsShopAddressUpdate, serviceAreaPromptOpen, shopSkipKey]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      title=""
      maxWidth="md"
      preventClose
      uniformHorizontalPadding16
      showCloseButton={false}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07]">
            <MapPinIcon className="h-5 w-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black leading-none tracking-tight text-white">
              Update your shop address
            </h2>
            <p className="mt-2 text-sm leading-5 text-zinc-400">
              Shop visits need a full street address so customers can find you.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Button
            href={ROUTES.DASHBOARD.BUSINESS_PROFILE_EDIT_SHOP_ADDRESS}
            variant="inverse"
            size="md"
            fullWidth
          >
            Update shop address
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => {
              window.sessionStorage.setItem(shopSkipKey, '1');
              setIsOpen(false);
            }}
          >
            I&apos;ll do it later
          </Button>
        </div>
      </div>
    </Modal>
  );
}
