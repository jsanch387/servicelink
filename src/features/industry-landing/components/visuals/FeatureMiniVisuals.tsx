import Image from 'next/image';
import React from 'react';

type SlotProps = {
  src?: string | null;
  alt: string;
  children: React.ReactNode;
};

function MiniSlot({ src, alt, children }: SlotProps) {
  if (src) {
    return (
      <div className="relative h-28 overflow-hidden rounded-xl border border-white/10 bg-[#141416]">
        <Image src={src} alt={alt} fill className="object-cover object-top" />
      </div>
    );
  }
  return (
    <div
      className="flex h-28 flex-col justify-center rounded-xl border border-white/10 bg-[#141416] p-3"
      aria-hidden
    >
      {children}
    </div>
  );
}

export function BookingMiniVisual({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  return (
    <MiniSlot src={src} alt={alt}>
      <div className="space-y-1.5">
        <div className="h-7 rounded-lg border border-[#262626] bg-[#181818]" />
        <div className="h-7 rounded-lg border border-[#262626] bg-[#181818]" />
        <div className="grid grid-cols-3 gap-1">
          <div className="h-6 rounded-md bg-[#2A2A2A]" />
          <div className="h-6 rounded-md bg-white" />
          <div className="h-6 rounded-md bg-[#2A2A2A]" />
        </div>
      </div>
    </MiniSlot>
  );
}

export function DepositsMiniVisual({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  return (
    <MiniSlot src={src} alt={alt}>
      <p className="text-[10px] text-zinc-500">Due now</p>
      <p className="text-lg font-semibold tabular-nums text-white">$50.00</p>
      <div className="mt-2 rounded-md bg-white py-1.5 text-center text-[10px] font-semibold text-black">
        Pay deposit
      </div>
    </MiniSlot>
  );
}

export function CrmMiniVisual({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  return (
    <MiniSlot src={src} alt={alt}>
      {['Sarah M. · Tahoe', 'James R. · Civic', 'Mike A. · F-150'].map(row => (
        <div
          key={row}
          className="mb-1 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-300 last:mb-0"
        >
          {row}
        </div>
      ))}
    </MiniSlot>
  );
}

export function SmsMiniVisual({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  return (
    <MiniSlot src={src} alt={alt}>
      <div className="max-w-[90%] rounded-2xl bg-white/[0.08] px-2.5 py-1.5 text-[10px] leading-snug text-zinc-100">
        You&apos;re booked — Thu 11:30 AM.
      </div>
      <div className="mt-1.5 max-w-[90%] rounded-2xl bg-white/[0.08] px-2.5 py-1.5 text-[10px] leading-snug text-zinc-100">
        On the way. ETA 12 min.
      </div>
    </MiniSlot>
  );
}

export function AppMiniVisual({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  return (
    <MiniSlot src={src} alt={alt}>
      <p className="text-[9px] uppercase tracking-wider text-zinc-500">Today</p>
      <p className="text-sm font-semibold text-white">3 jobs</p>
      <div className="mt-2 flex items-center justify-between rounded-md bg-white/[0.05] px-2 py-1.5">
        <span className="text-[10px] text-zinc-300">Interior · Sarah</span>
        <span className="text-[10px] tabular-nums text-zinc-500">11:30</span>
      </div>
    </MiniSlot>
  );
}
