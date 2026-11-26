import Image from 'next/image';
import React from 'react';

type PhoneDeviceFrameProps = {
  children?: React.ReactNode;
  screenshotSrc?: string | null;
  screenshotAlt?: string;
  className?: string;
};

/** Phone chrome matching landing mockups. Screenshot slot wins when src is set. */
export function PhoneDeviceFrame({
  children,
  screenshotSrc,
  screenshotAlt = '',
  className = '',
}: PhoneDeviceFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[280px] rounded-[28px] border border-white/10 bg-[#141416] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${className}`.trim()}
    >
      <div className="mb-1.5 flex justify-center" aria-hidden>
        <span className="h-1.5 w-16 rounded-full bg-white/10" />
      </div>
      <div className="relative aspect-[9/19] overflow-hidden rounded-[22px] bg-[#0F0F0F]">
        {screenshotSrc ? (
          <Image
            src={screenshotSrc}
            alt={screenshotAlt}
            fill
            className="object-cover object-top"
            sizes="280px"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
