'use client';

import { Button, IconButton, Modal } from '@/components/shared';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface AvailabilitySettingInfoProps {
  title: string;
  children: React.ReactNode;
}

export const AvailabilitySettingInfo: React.FC<
  AvailabilitySettingInfoProps
> = ({ title, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label={title}
        title={title}
        onClick={() => setOpen(true)}
        className="shrink-0 -mr-1.5 -mt-1"
        icon={<InformationCircleIcon className="h-5 w-5" />}
      />
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={title}
        maxWidth="sm"
        uniformHorizontalPadding16
        titleClassName="font-semibold"
        contentClassName="!pt-4 sm:!pt-5 !pb-4 sm:!pb-5"
      >
        <div className="space-y-3 text-sm leading-relaxed text-gray-300">
          {children}
        </div>
        <Button
          type="button"
          variant="inverse"
          size="sm"
          fullWidth
          className="mt-5"
          onClick={() => setOpen(false)}
        >
          Got it
        </Button>
      </Modal>
    </>
  );
};
