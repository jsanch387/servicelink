import Image from 'next/image';

export type LandingPageDisplayImageProps = {
  /** Tighter layout for embedded sections (e.g. workshop). */
  variant?: 'hero' | 'compact';
  /** Show floating booking / views cards beside the phone. */
  showFloatingCards?: boolean;
  className?: string;
};

export function LandingPageDisplayImage({
  variant = 'hero',
  showFloatingCards = true,
  className = '',
}: LandingPageDisplayImageProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`relative flex justify-center ${className}`.trim()}>
      <div
        className={`absolute -z-10 bg-white/[0.03] blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
          isCompact ? 'w-56 h-56 sm:w-64 sm:h-64' : 'w-64 h-64 sm:w-72 sm:h-72'
        }`}
        aria-hidden
      />

      <div
        className={`relative w-full ${
          isCompact
            ? 'max-w-[min(100%,340px)] sm:max-w-[380px]'
            : 'max-w-[300px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[480px] lg:-ml-4'
        }`}
      >
        <Image
          src="/landing-page-display.png"
          alt="ServiceLink booking profile on mobile"
          width={450}
          height={900}
          className="w-full h-auto object-contain"
          priority={!isCompact}
          quality={90}
          sizes={
            isCompact
              ? '(max-width: 640px) 340px, 380px'
              : '(max-width: 640px) 300px, (max-width: 768px) 380px, (max-width: 1024px) 420px, 480px'
          }
        />

        {showFloatingCards ? (
          <>
            <div
              className={`absolute animate-subtle-float ${
                isCompact
                  ? 'top-6 -left-4 sm:top-8 sm:-left-6'
                  : 'top-8 -left-8 sm:top-12 sm:-left-12 md:top-16 md:-left-16 lg:top-20 lg:-left-20'
              }`}
              style={{ animationDelay: '0s' }}
            >
              <div
                className={`bg-white rounded-xl shadow-2xl border border-gray-200 ${
                  isCompact
                    ? 'p-3 min-w-[130px] sm:min-w-[145px] sm:rounded-2xl sm:p-3.5'
                    : 'p-3 sm:p-4 rounded-2xl min-w-[140px] sm:min-w-[160px]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div
                    className={`bg-green-500 rounded-lg flex items-center justify-center ${
                      isCompact ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'
                    }`}
                  >
                    <svg
                      className={
                        isCompact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
                      }
                      fill="white"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p
                    className={`text-gray-500 font-bold uppercase tracking-wider ${
                      isCompact ? 'text-[10px]' : 'text-[10px] sm:text-xs'
                    }`}
                  >
                    New Booking
                  </p>
                </div>
                <p
                  className={`font-extrabold text-black ${
                    isCompact ? 'text-xl' : 'text-xl sm:text-2xl'
                  }`}
                >
                  $149.00
                </p>
              </div>
            </div>

            <div
              className={`absolute animate-subtle-float ${
                isCompact
                  ? 'bottom-6 -right-4 sm:bottom-8 sm:-right-6'
                  : 'bottom-8 -right-8 sm:bottom-12 sm:-right-12 md:bottom-16 md:-right-16 lg:bottom-20 lg:-right-20'
              }`}
              style={{ animationDelay: '1.5s' }}
            >
              <div
                className={`bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700 ${
                  isCompact
                    ? 'p-3 min-w-[130px] sm:min-w-[145px] sm:rounded-2xl sm:p-3.5'
                    : 'p-3 sm:p-4 rounded-2xl min-w-[140px] sm:min-w-[160px]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div
                    className={`bg-gray-500 rounded-lg flex items-center justify-center ${
                      isCompact ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'
                    }`}
                  >
                    <svg
                      className={
                        isCompact ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'
                      }
                      fill="white"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <p
                    className={`text-gray-400 font-bold uppercase tracking-wider ${
                      isCompact ? 'text-[10px]' : 'text-[10px] sm:text-xs'
                    }`}
                  >
                    Views Today
                  </p>
                </div>
                <p
                  className={`font-extrabold text-white ${
                    isCompact ? 'text-xl' : 'text-xl sm:text-2xl'
                  }`}
                >
                  342
                </p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
