'use client';

import React from 'react';
import { GlassCard } from './GlassCard';

interface FormStepSectionProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Section label outside a glass card; inputs live inside the card. */
export function FormStepSection({
  title,
  children,
  footer,
}: FormStepSectionProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
        {title}
      </h2>
      <GlassCard padding="md" className="text-left">
        <div className="space-y-4">{children}</div>
      </GlassCard>
      {footer}
    </div>
  );
}
