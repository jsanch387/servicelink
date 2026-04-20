import { LinkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const DOMAIN = 'myservicelink.app';

interface ShareableLinkDisplayProps {
  /** The business handle/slug (e.g. blacklabelauto). Shown in bold. */
  businessSlug?: string;
  className?: string;
}

export const ShareableLinkDisplay: React.FC<ShareableLinkDisplayProps> = ({
  businessSlug = 'blacklabelauto',
  className = '',
}) => {
  const fullLink = `${DOMAIN}/${businessSlug}`;

  return (
    <div
      className={`flex items-center justify-center w-full max-w-xl mx-auto p-0 sm:p-5 md:p-6 font-sans ${className}`}
    >
      <div className="relative w-full">
        <div className="relative bg-neutral-900 border border-white/[0.08] rounded-2xl p-6 sm:p-8 overflow-hidden backdrop-blur-xl">
          {/* Label */}
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
            Your custom link
          </p>

          {/* Link - one line, font scales so full URL fits on all screens */}
          <div className="flex items-center gap-3 w-full bg-white/[0.06] border border-white/[0.12] rounded-xl px-4 py-3.5 sm:px-5 sm:py-4 min-w-0 shadow-[0_0_20px_rgba(255,255,255,0.06),0_0_40px_rgba(255,255,255,0.04)]">
            <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <p
              className="font-mono text-xs sm:text-sm md:text-base min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              title={fullLink}
            >
              <span className="text-gray-500">{DOMAIN}/</span>
              <span className="text-white font-semibold">{businessSlug}</span>
            </p>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            One link for bio, socials, and business cards
          </p>
        </div>
      </div>
    </div>
  );
};
