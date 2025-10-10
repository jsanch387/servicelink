/**
 * Logo Component - Reusable ServiceLink branding component
 * Modern SaaS design with logo image and premium Poppins typography
 */

import Image from 'next/image';
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  href?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  href,
}) => {
  const sizeConfig = {
    sm: {
      imageSize: 24,
      imageClass: 'h-6 w-6',
      textClass: 'text-lg',
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

  const logoContent = (
    <div className={`flex items-center  ${className}`}>
      <Image
        src="/service-link-logo.png"
        alt="ServiceLink Logo"
        width={config.imageSize}
        height={config.imageSize}
        className={`${config.imageClass} object-contain flex-shrink-0`}
        priority
      />
      {showText && (
        <span
          className={`${config.textClass} text-white`}
          style={{
            fontFamily:
              'var(--font-space-grotesk), var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: '700',
            letterSpacing: '-0.02em',
            fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
          }}
        >
          ServiceLink
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className="transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-neutral-800 rounded-lg"
      >
        {logoContent}
      </a>
    );
  }

  return logoContent;
};

export default Logo;
