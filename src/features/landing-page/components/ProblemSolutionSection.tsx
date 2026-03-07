import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { GlassCard } from '@/components/shared';

const frictionItems = [
  '"DM me for prices" — confusing for customers',
  'Sending price lists manually, over and over',
  'Customers don\'t know your location or services',
  'Missed DMs and texts mean lost bookings',
];

const solutionItems = [
  'One professional link — your storefront',
  'Services and prices clear at a glance',
  'Service area and contact visible',
  'Book instantly — no back-and-forth',
];

export const ProblemSolutionSection: React.FC = () => {
  return (
    <section
      id="problem"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 border-t border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12 sm:mb-14">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">
            Built for service pros
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white tracking-tight">
            Less friction. More bookings.
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left">
          {/* The Friction */}
          <GlassCard
            padding="lg"
            rounded="rounded-2xl"
            showBlur={false}
            className="border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircleIcon className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                The friction
              </h3>
            </div>
            <ul className="space-y-3 sm:space-y-4">
              {frictionItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-400 text-sm sm:text-base leading-relaxed">
                  <span className="text-gray-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* The Solution */}
          <GlassCard
            padding="lg"
            rounded="rounded-2xl"
            showBlur={false}
            className="border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                With ServiceLink
              </h3>
            </div>
            <ul className="space-y-3 sm:space-y-4">
              {solutionItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-gray-300 text-sm sm:text-base leading-relaxed">
                  <CheckCircleIcon className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};
