import Image from 'next/image';
import React from 'react';

const SIZE_CLASS = {
  sm: 'max-w-[200px]',
  md: 'max-w-[260px]',
  lg: 'max-w-[300px]',
} as const;

type PhoneDeviceFrameProps = {
  children?: React.ReactNode;
  screenshotSrc?: string | null;
  screenshotAlt?: string;
  className?: string;
  size?: keyof typeof SIZE_CLASS;
  float?: boolean;
};

/** iPhone-style chrome. Screenshot slot wins when src is set. */
export function PhoneDeviceFrame({
  children,
  screenshotSrc,
  screenshotAlt = '',
  className = '',
  size = 'md',
  float = false,
}: PhoneDeviceFrameProps) {
  return (
    <div
      className={`relative mx-auto w-full ${SIZE_CLASS[size]} rounded-[2.35rem] bg-[#0b0b0c] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_28px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.12] transition-transform duration-500 motion-safe:hover:-translate-y-1 ${
        float ? 'motion-safe:animate-industry-device-float' : ''
      } ${className}`.trim()}
      aria-hidden={!screenshotSrc}
    >
      <div className="rounded-[2.15rem] bg-[#161618] p-[7px]">
        <div className="relative aspect-[9/19.4] overflow-hidden rounded-[1.85rem] bg-[#0F0F0F]">
          <span
            className="absolute left-1/2 top-2.5 z-20 h-[18px] w-[78px] -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
            aria-hidden
          />
          {screenshotSrc ? (
            <Image
              src={screenshotSrc}
              alt={screenshotAlt}
              fill
              className="object-cover object-top"
              sizes="300px"
            />
          ) : (
            children
          )}
          {screenshotSrc ? null : (
            <span
              className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-[4px] w-[108px] -translate-x-1/2 rounded-full bg-white/25"
              aria-hidden
            />
          )}
        </div>
      </div>
    </div>
  );
}
