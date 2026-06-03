import {
  AtSymbolIcon,
  BoltIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

export const WhatsIncludedSection: React.FC = () => {
  return (
    <section
      id="whats-included"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 border-t border-[var(--dashboard-border)] overflow-hidden bg-[var(--dashboard-bg)]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 md:mb-8 tracking-tight">
              Your entire business, <br className="hidden sm:block" />
              in one clean link.
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-6 sm:mb-8 md:mb-10">
              When you sign up for Service Link, you aren&apos;t just getting a
              page—you&apos;re getting a conversion machine built for the mobile
              age.
            </p>

            <div className="space-y-6 sm:space-y-8">
              {/* Feature 1 */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20">
                  <DevicePhoneMobileIcon className="text-orange-500 text-xl sm:text-2xl" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold mb-2 text-white">
                    The Premium Mobile Profile
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    A high-end, app-like landing page that showcases your logo,
                    services, and area. No coding, no design skills needed.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-purple-600/10 flex items-center justify-center border border-purple-500/20">
                  <BoltIcon className="text-purple-500 text-xl sm:text-2xl" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold mb-2 text-white">
                    The Action Dashboard
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    Direct &apos;Call&apos;, &apos;Text&apos;, and
                    &apos;Booking&apos; buttons that bypass the inbox and get
                    you on the phone with customers immediately.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                  <AtSymbolIcon className="text-blue-500 text-xl sm:text-2xl" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-bold mb-2 text-white">
                    Your Custom Handle
                  </h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    Get a clean, short URL like{' '}
                    <strong className="text-white">sl.com/yourname</strong> that
                    looks professional on your truck, business cards, and
                    Instagram bio.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Product Mockup Visual */}
          <div className="relative mt-8 lg:mt-0">
            <div
              className="rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] aspect-[4/5] w-full max-w-[350px] sm:max-w-[400px] md:max-w-[450px] mx-auto shadow-3xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(45deg, #1a1a1a, #262626)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Placeholder Text Overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  color: 'rgba(255,255,255,0.05)',
                  fontWeight: 900,
                  fontSize: 'clamp(1rem, 4vw, 2rem)',
                  letterSpacing: '0.5rem',
                }}
              >
                IMAGE PREVIEW
              </div>

              {/* Simulated Profile UI overlay */}
              <div className="absolute inset-x-4 sm:inset-x-6 md:inset-x-8 bottom-4 sm:bottom-6 md:bottom-8 bg-white/5 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-white/10 animate-pulse">
                <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/10"></div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="w-24 sm:w-32 h-2.5 sm:h-3 bg-white/20 rounded"></div>
                    <div className="w-16 sm:w-20 h-2 bg-white/10 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="h-8 sm:h-10 rounded-lg sm:rounded-xl"
                    style={{ background: 'rgba(251, 146, 60, 0.4)' }}
                  ></div>
                  <div className="h-8 sm:h-10 bg-white/10 rounded-lg sm:rounded-xl"></div>
                </div>
              </div>
            </div>

            {/* Stats Badge */}
            <div className="absolute -top-4 sm:-top-5 md:-top-6 -right-4 sm:-right-5 md:-right-6 bg-white/5 backdrop-blur-xl p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/10 hidden md:block">
              <p className="text-orange-400 font-black text-xl sm:text-2xl">
                98%
              </p>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                Mobile Conversion
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
