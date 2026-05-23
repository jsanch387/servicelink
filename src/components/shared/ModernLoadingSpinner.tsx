/**
 * ModernLoadingSpinner - Sleek, modern loading spinner
 */

import React from 'react';

type ModernLoadingSpinnerVariant = 'orange' | 'white';

interface ModernLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  /** Accent color for the animated ring. Defaults to orange. */
  variant?: ModernLoadingSpinnerVariant;
}

const variantRingClasses: Record<ModernLoadingSpinnerVariant, string> = {
  orange: 'border-t-orange-400 border-r-orange-400',
  white: 'border-t-white border-r-white',
};

const variantGlowClasses: Record<ModernLoadingSpinnerVariant, string> = {
  orange: 'border-orange-400/20',
  white: 'border-white/20',
};

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const ModernLoadingSpinner: React.FC<ModernLoadingSpinnerProps> = ({
  size = 'lg',
  text = 'Loading...',
  className = '',
  variant = 'orange',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      {/* Sleek animated spinner */}
      <div className="relative">
        {/* Outer ring */}
        <div
          className={`${sizeClasses[size]} border-2 border-neutral-700 rounded-full`}
        />
        <div
          className={`${sizeClasses[size]} border-2 border-transparent ${variantRingClasses[variant]} rounded-full animate-spin absolute top-0 left-0`}
        />
        <div
          className={`${sizeClasses[size]} border ${variantGlowClasses[variant]} rounded-full absolute top-0 left-0 animate-pulse`}
        />
      </div>

      {/* Loading text */}
      {text && <p className="text-white font-medium text-sm">{text}</p>}
    </div>
  );
};

export default ModernLoadingSpinner;
