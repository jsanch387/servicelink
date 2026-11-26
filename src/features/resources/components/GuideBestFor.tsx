import React from 'react';

export function GuideBestFor({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 text-sm text-gray-400">
      <span className="mr-2 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-300">
        Best for
      </span>
      <span className="text-gray-300">{children}</span>
    </p>
  );
}
