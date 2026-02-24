/**
 * RequiredLabel - Reusable amber "Required" pill with warning icon
 * Use for fields or sections that must be completed (e.g. custom link, profile steps).
 */

'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface RequiredLabelProps {
  /** Accessible title/tooltip */
  title?: string;
  className?: string;
}

export const RequiredLabel: React.FC<RequiredLabelProps> = ({
  title = 'This is required to continue',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-amber-400 text-xs font-semibold flex-shrink-0 ${className}`}
      title={title}
    >
      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
      Required
    </span>
  );
};

export default RequiredLabel;
