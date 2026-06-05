import { LinkIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { HeroBookingLinkCard } from './HeroFloatingCardShell';

const DOMAIN = 'myservicelink.app';

interface ShareableLinkDisplayProps {
  /** The business handle/slug (e.g. blacklabelauto). Shown in bold. */
  businessSlug?: string;
  className?: string;
  /** Full section layout vs compact card for hero float. */
  variant?: 'default' | 'compact' | 'hero-float';
  label?: string;
  showFooter?: boolean;
}

export const ShareableLinkDisplay: React.FC<ShareableLinkDisplayProps> = ({
  businessSlug = 'blacklabelauto',
  className = '',
  variant = 'default',
  label = 'Your custom link',
  showFooter,
}) => {
  const fullLink = `${DOMAIN}/${businessSlug}`;
  const isHeroFloat = variant === 'hero-float';
  const isCompact = variant === 'compact' || isHeroFloat;
  const shouldShowFooter = showFooter ?? !isCompact;

  if (isHeroFloat) {
    return (
      <div className={`w-full font-sans ${className}`.trim()}>
        <HeroBookingLinkCard
          label={label}
          domain={DOMAIN}
          slug={businessSlug}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center w-full font-sans ${
        isCompact ? 'max-w-none' : 'max-w-xl mx-auto p-0 sm:p-5 md:p-6'
      } ${className}`.trim()}
    >
      <div className="relative w-full">
        <div
          className={`relative border border-white/[0.08] bg-neutral-900 backdrop-blur-xl ${
            isCompact
              ? 'overflow-visible rounded-2xl p-3.5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]'
              : 'overflow-hidden rounded-2xl p-4'
          }`}
        >
          <p
            className={`font-medium text-gray-500 tracking-wide ${
              isCompact ? 'mb-3 text-xs' : 'mb-4 text-sm'
            }`}
          >
            {label}
          </p>

          <div
            className={`flex w-full items-start gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] shadow-[0_0_20px_rgba(255,255,255,0.06),0_0_40px_rgba(255,255,255,0.04)] ${
              isCompact ? 'px-3 py-2.5' : 'px-4 py-3.5 sm:px-5 sm:py-4'
            }`}
          >
            <LinkIcon
              className={`mt-0.5 shrink-0 text-gray-400 ${
                isCompact ? 'h-4 w-4' : 'h-5 w-5'
              }`}
              aria-hidden
            />
            <p
              className={`font-mono leading-snug ${
                isCompact
                  ? 'text-[12px] sm:text-[13px] whitespace-normal break-words'
                  : 'min-w-0 overflow-x-auto whitespace-nowrap text-base sm:text-sm md:text-base [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              }`}
              title={fullLink}
            >
              <span className="text-gray-500">{DOMAIN}/</span>
              <span className="font-semibold text-white">{businessSlug}</span>
            </p>
          </div>

          {shouldShowFooter ? (
            <p className="mt-4 text-center text-xs text-gray-500">
              One link for bio, socials, and business cards
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};
