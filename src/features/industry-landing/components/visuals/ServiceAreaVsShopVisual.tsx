import React from 'react';

export function ServiceAreaVisual() {
  return (
    <div
      className="relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#141416]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_62%)]" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
      <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
      <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-zinc-400">
        15-mile service area
      </p>
    </div>
  );
}

export function ShopAddressVisual() {
  return (
    <div
      className="relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#141416] p-4"
      aria-hidden
    >
      <div className="mb-3 h-16 rounded-lg border border-white/10 bg-white/[0.04]" />
      <p className="text-[12px] font-semibold text-white">412 Barton Springs</p>
      <p className="text-[11px] text-zinc-500">Austin, TX · Come to the shop</p>
    </div>
  );
}
