/**
 * Branding Component - Reusable ServiceLink branding component
 * Supports logo only, text only, or logo + text combinations
 * Uses Space Grotesk for clean, modern SaaS typography
 */

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export type BrandingVariant = 'logo' | 'text' | 'full';

interface BrandingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: BrandingVariant;
  className?: string;
  href?: string;
  logoSize?: 'sm' | 'md' | 'lg'; // Optional: separate size for logo image only
}

export const Logo: React.FC<BrandingProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  href,
  logoSize,
}) => {
  const sizeConfig = {
    sm: {
      imageSize: 24,
      imageClass: 'h-6 w-6',
      textClass: 'text-base',
      spacing: 'space-x-2',
    },
    md: {
      imageSize: 32,
      imageClass: 'h-8 w-8',
      textClass: 'text-xl',
      spacing: 'space-x-3',
    },
    lg: {
      imageSize: 40,
      imageClass: 'h-10 w-10',
      textClass: 'text-2xl',
      spacing: 'space-x-4',
    },
  };

  const config = sizeConfig[size];
  const logoConfig = logoSize ? sizeConfig[logoSize] : config; // Use separate logo size if provided
  const showLogo = variant === 'logo' || variant === 'full';
  const showText = variant === 'text' || variant === 'full';

  const logoContent = (
    <div className={`flex items-center ${className}`}>
      {showLogo && (
        <Image
          src="/service-link-logo.png"
          alt="ServiceLink Logo"
          width={logoConfig.imageSize}
          height={logoConfig.imageSize}
          className={`${logoConfig.imageClass} object-contain flex-shrink-0`}
          priority
        />
      )}
      {showText && (
        <span className={`${config.textClass} text-white logo-text`}>
          ServiceLink
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-800 rounded-lg"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

// Alias for backward compatibility
export const Branding = Logo;
export default Logo;
