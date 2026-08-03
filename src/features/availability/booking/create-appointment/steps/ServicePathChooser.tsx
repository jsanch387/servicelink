'use client';

import React from 'react';

export type ServicePathChoice = 'catalog' | 'custom';

export interface ServicePathChooserProps {
  value: ServicePathChoice | null;
  onChange: (value: ServicePathChoice) => void;
}

export function ServicePathChooser({
  value,
  onChange,
}: ServicePathChooserProps) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => onChange('catalog')}
        className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors ${
          value === 'catalog'
            ? 'border-white/40 bg-white/10'
            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
        }`}
      >
        <div className="text-base font-semibold text-white">Your services</div>
        <div className="mt-1 text-sm text-zinc-400">
          Choose something you already offer.
        </div>
      </button>
      <button
        type="button"
        onClick={() => onChange('custom')}
        className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition-colors ${
          value === 'custom'
            ? 'border-white/40 bg-white/10'
            : 'border-white/10 bg-white/[0.03] hover:border-white/25'
        }`}
      >
        <div className="text-base font-semibold text-white">Custom job</div>
        <div className="mt-1 text-sm text-zinc-400">
          Name the work and set your own price.
        </div>
      </button>
    </div>
  );
}
