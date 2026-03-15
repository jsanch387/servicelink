'use client';

import { ROUTES } from '@/constants/routes';
import { useState } from 'react';
import { Button } from '../../../components/shared/Button';

export const PricingCTASection: React.FC = () => {
  const [slugInput, setSlugInput] = useState('');

  return (
    <section id="pricing" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center bg-white/5 backdrop-blur-xl p-6 sm:p-8 md:p-12 lg:p-16 xl:p-24 rounded-3xl sm:rounded-[3rem] md:rounded-[4rem] border border-orange-500/20 relative overflow-hidden shadow-3xl">
        {/* Background Glow */}
        <div
          className="absolute -top-12 sm:-top-16 md:-top-24 -right-12 sm:-right-16 md:-right-24 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 blur-[80px] sm:blur-[100px] md:blur-[120px]"
          style={{ background: 'rgba(251, 146, 60, 0.1)' }}
        ></div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 md:mb-8 tracking-tighter uppercase leading-none">
          Claim Your Link <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(to right, #fb923c, #f97316)',
            }}
          >
            Before It&apos;s Gone.
          </span>
        </h2>
        <p className="text-gray-400 mb-6 sm:mb-8 md:mb-12 text-base sm:text-lg font-medium px-2">
          Join 2,000+ service businesses using Service Link to look professional
          and book more jobs. It takes less than 2 minutes to set up.
        </p>

        <div className="flex flex-col items-center gap-4 sm:gap-5 md:gap-6">
          {/* Slug Checker Input */}
          <div className="flex items-center bg-white/5 backdrop-blur-xl p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl border border-white/10 w-full max-w-md shadow-inner">
            <span className="pl-2 sm:pl-3 md:pl-4 text-gray-500 font-bold text-xs sm:text-sm">
              myservicelink.app/
            </span>
            <input
              type="text"
              placeholder="yourbusiness"
              value={slugInput}
              onChange={e => setSlugInput(e.target.value)}
              className="bg-transparent border-none outline-none text-white font-bold w-full px-1 sm:px-2 text-sm sm:text-base"
            />
            <Button
              href={ROUTES.AUTH.SIGNUP}
              variant="primary"
              className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black"
            >
              Check
            </Button>
          </div>

          {/* Main CTA Button */}
          <Button
            href={ROUTES.AUTH.SIGNUP}
            variant="primary"
            className="w-full max-w-sm py-3 sm:py-4 md:py-5 bg-white text-black rounded-xl sm:rounded-2xl font-black text-base sm:text-lg md:text-xl hover:scale-105 transition-all shadow-2xl"
          >
            Create My Profile
          </Button>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 mt-2 sm:mt-3 md:mt-4 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path
                fillRule="evenodd"
                d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                clipRule="evenodd"
              />
            </svg>
            No Credit Card Required
          </div>
        </div>
      </div>
    </section>
  );
};
