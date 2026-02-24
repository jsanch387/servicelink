/**
 * WarningCallout - Reusable amber-bordered message box
 * Use for important notices (e.g. "You need a custom link so customers can find and book you.").
 */

'use client';

import React from 'react';

interface WarningCalloutProps {
  children: React.ReactNode;
  className?: string;
}

export const WarningCallout: React.FC<WarningCalloutProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 min-w-0 ${className}`}
    >
      <p className="text-sm text-amber-200/90 min-w-0">{children}</p>
    </div>
  );
};

export default WarningCallout;
