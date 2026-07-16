'use client';

import React from 'react';
import { GlassCard } from './GlassCard';

interface FormStepSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Section label outside a glass card; inputs live inside the card. */
export function FormStepSection({
  title,
  description,
  children,
  footer,
}: FormStepSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      <GlassCard padding="md" className="text-left">
        <div className="space-y-4">{children}</div>
      </GlassCard>
      {footer}
    </div>
  );
}
