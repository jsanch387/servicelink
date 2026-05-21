'use client';

import { ROUTES } from '@/constants/routes';
import Image from 'next/image';
import React from 'react';
import { Button } from '@/components/shared';

export const HeroSection: React.FC = () => {
  return (
    <section
      className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Hero Text */}
        <div className="text-left">
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 tracking-tight leading-[1.08] text-white uppercase"
          >
            MORE BOOKINGS. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              LESS BACK-AND-FORTH.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 md:mb-10 leading-relaxed font-medium max-w-xl">
            Give customers one clean booking link to view services, request
            quotes, and pay online. Run bookings, deposits, and customer
            follow-up from one dashboard.
          </p>

          {/* Hero CTA Buttons */}
          <div className="mb-6 sm:mb-8 md:mb-10 max-w-lg">
            <div className="flex">
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="inverse"
                size="lg"
                className="w-full sm:w-auto font-bold"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Display Image */}
        <div className="relative flex justify-center lg:justify-end mt-8 lg:mt-0">
          <div className="absolute -z-10 w-64 h-64 sm:w-72 sm:h-72 bg-white/[0.03] blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

          {/* Landing Page Display Image - Transparent background, no container */}
          <div className="relative w-full max-w-[300px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[480px] lg:-ml-4">
            <Image
              src="/landing-page-display.png"
              alt="ServiceLink Profile Preview"
              width={450}
              height={900}
              className="w-full h-auto object-contain"
              priority
              quality={90}
              sizes="(max-width: 640px) 300px, (max-width: 768px) 380px, (max-width: 1024px) 420px, 480px"
            />

            {/* Floating Status Card A - New Booking (Top Left) */}
            <div
              className="absolute top-8 -left-8 sm:top-12 sm:-left-12 md:top-16 md:-left-16 lg:top-20 lg:-left-20 animate-subtle-float"
              style={{ animationDelay: '0s' }}
            >
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-gray-200 min-w-[140px] sm:min-w-[160px]">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                      New Booking
                    </p>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-black">
                  $149.00
                </p>
              </div>
            </div>

            {/* Floating Status Card B - Views Today (Bottom Right) */}
            <div
              className="absolute bottom-8 -right-8 sm:bottom-12 sm:-right-12 md:bottom-16 md:-right-16 lg:bottom-20 lg:-right-20 animate-subtle-float"
              style={{ animationDelay: '1.5s' }}
            >
              <div className="bg-neutral-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl border border-neutral-700 min-w-[140px] sm:min-w-[160px]">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
                      Views Today
                    </p>
                  </div>
                </div>
                <p className="text-xl sm:text-2xl font-extrabold text-white">
                  342
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
