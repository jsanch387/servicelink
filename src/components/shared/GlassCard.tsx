/**
 * GlassCard Component
 *
 * A reusable glass morphism card component with backdrop blur effect.
 * Features a subtle glass appearance with optional decorative blur element.
 */

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  /**
   * Optional decorative blur color in the top right corner
   * Accepts Tailwind color classes (e.g., 'bg-orange-500', 'bg-emerald-500')
   */
  blurColor?: string;
  /**
   * Custom className for additional styling
   */
  className?: string;
  /**
   * Padding size - defaults to responsive p-4 sm:p-6
   */
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /**
   * Whether to show the decorative blur element
   */
  showBlur?: boolean;
  /**
   * Click handler for the card
   */
  onClick?: () => void;
  /**
   * Border radius - accepts Tailwind rounded classes (e.g., 'rounded-xl', 'rounded-2xl', 'rounded-[2rem]')
   * Defaults to 'rounded-[2rem]'
   */
  rounded?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  blurColor = 'bg-zinc-500',
  className = '',
  padding = 'md',
  showBlur = true,
  onClick,
  rounded = 'rounded-[2rem]',
}) => {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    none: '',
  };

  const baseClasses = `relative overflow-hidden bg-white/[0.03] backdrop-blur-md border border-white/[0.08] ${rounded} transition-all active:scale-[0.98] w-full h-full`;

  const combinedClasses =
    `${baseClasses} ${paddingClasses[padding]} ${className} ${
      onClick ? 'cursor-pointer' : ''
    }`.trim();

  return (
    <div className={combinedClasses} onClick={onClick}>
      {/* Decorative blur element in top right corner */}
      {showBlur && (
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${blurColor} opacity-[0.05] blur-3xl -mr-16 -mt-16 pointer-events-none`}
        />
      )}

      {/* Content with z-index to appear above blur */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
