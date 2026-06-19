'use client';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const publicFlowStickyBackHeaderClassName =
  'sticky top-0 z-10 border-b border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm';

export const publicFlowStickyBackHeaderInnerClassName =
  'mx-auto flex max-w-2xl min-h-[52px] items-center px-4 sm:px-6';

/** Back link / button row — chevron optically aligned with label text. */
export const publicFlowBackNavClassName =
  'inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium leading-none text-gray-400 transition-colors hover:text-white';

export function PublicFlowBackChevron() {
  return (
    <ChevronLeftIcon
      className="relative top-px h-[18px] w-[18px] shrink-0"
      strokeWidth={2}
      aria-hidden
    />
  );
}

interface PublicFlowStickyBackHeaderProps {
  children: React.ReactNode;
}

export function PublicFlowStickyBackHeader({
  children,
}: PublicFlowStickyBackHeaderProps) {
  return (
    <div className={publicFlowStickyBackHeaderClassName}>
      <div className={publicFlowStickyBackHeaderInnerClassName}>{children}</div>
    </div>
  );
}

interface PublicFlowBackNavLabelProps {
  label: string;
}

export function PublicFlowBackNavLabel({ label }: PublicFlowBackNavLabelProps) {
  return (
    <>
      <PublicFlowBackChevron />
      <span>{label}</span>
    </>
  );
}
