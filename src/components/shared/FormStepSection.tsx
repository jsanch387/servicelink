'use client';

import React from 'react';
import { GlassCard } from './GlassCard';

interface FormStepSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Optional control beside the title (e.g. remove). */
  action?: React.ReactNode;
}

/** Section label outside a glass card; inputs live inside the card. */
export function FormStepSection({
  title,
  description,
  children,
  footer,
  action,
}: FormStepSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <GlassCard padding="md" className="text-left">
        <div className="space-y-4">{children}</div>
      </GlassCard>
      {footer}
    </div>
  );
}
