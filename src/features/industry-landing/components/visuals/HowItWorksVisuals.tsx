import { LinkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const miniFrame =
  'flex h-[9.5rem] flex-col justify-center rounded-2xl border border-white/[0.08] bg-[#141416] p-3';

export function ShareLinkVisual() {
  return (
    <div className={miniFrame} aria-hidden>
      <p className="mb-2 text-[9px] font-medium uppercase tracking-wider text-zinc-500">
        Your link
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-2">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <p className="truncate font-mono text-[10px] text-zinc-200">
          myservicelink.app/apex
        </p>
      </div>
      <p className="mt-2 text-[10px] text-zinc-500">
        Instagram · Google · texts
      </p>
    </div>
  );
}

export function BookPayVisual() {
  return (
    <div className={miniFrame} aria-hidden>
      <p className="text-[10px] font-semibold text-white">SUV interior</p>
      <p className="mt-0.5 text-[10px] text-zinc-500">Thu 11:30 AM</p>
      <div className="mt-3 rounded-lg border border-white/10 bg-white px-2.5 py-2 text-center">
        <p className="text-[10px] font-semibold text-neutral-950">
          Pay $50 deposit
        </p>
      </div>
      <p className="mt-2 text-[10px] text-zinc-500">Pro checkout</p>
    </div>
  );
}

export function ShowUpVisual() {
  return (
    <div className={miniFrame} aria-hidden>
      <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
        Next job
      </p>
      <p className="mt-1 text-[13px] font-semibold text-white">Sarah M.</p>
      <p className="text-[10px] text-zinc-400">2019 Tahoe · Interior</p>
      <p className="mt-2 text-[10px] text-zinc-500">412 Barton Springs Rd</p>
      <p className="text-[10px] tabular-nums text-zinc-400">11:30 AM</p>
    </div>
  );
}
