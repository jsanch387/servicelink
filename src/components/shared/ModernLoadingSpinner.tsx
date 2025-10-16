/**
 * ModernLoadingSpinner - Sleek, modern loading spinner
 * Clean orange animated spinner with smooth animations
 */

import React from 'react';

interface ModernLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

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
        {/* Animated orange ring */}
        <div
          className={`${sizeClasses[size]} border-2 border-transparent border-t-orange-400 border-r-orange-400 rounded-full animate-spin absolute top-0 left-0`}
        />
        {/* Inner glow effect */}
        <div
          className={`${sizeClasses[size]} border border-orange-400/20 rounded-full absolute top-0 left-0 animate-pulse`}
        />
      </div>

      {/* Loading text */}
      {text && <p className="text-white font-medium text-sm">{text}</p>}
    </div>
  );
};

export default ModernLoadingSpinner;
