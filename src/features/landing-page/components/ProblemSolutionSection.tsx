import { CheckCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const ProblemSolutionSection: React.FC = () => {
  return (
    <section
      id="problem"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-white/[0.01] border-t border-white/5"
    >
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-10 sm:mb-12 md:mb-16 tracking-tight">
          Built for Service Pros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 text-left">
          {/* The Friction */}
          <div className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-red-500/10">
            <h4 className="text-red-400 font-bold mb-4 sm:mb-6 flex items-center gap-2 uppercase tracking-widest text-xs sm:text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              The Friction
            </h4>
            <ul className="space-y-4 sm:space-y-6 text-gray-400 text-sm sm:text-base">
              <li className="flex gap-3">
                <span>•</span>
                <span>&quot;DM me for prices&quot; (confusing)</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Sending price lists manually</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Customers don&apos;t know your location</span>
              </li>
              <li className="flex gap-3">
                <span>•</span>
                <span>Missed DMs = Lost Money</span>
              </li>
            </ul>
          </div>

          {/* Service Link Solution */}
          <div className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-green-500/10">
            <h4 className="text-green-400 font-bold mb-4 sm:mb-6 flex items-center gap-2 uppercase tracking-widest text-xs sm:text-sm">
              <CheckCircleIcon className="w-4 h-4" />
              ServiceLink
            </h4>
            <ul className="space-y-4 sm:space-y-6 text-gray-200 text-sm sm:text-base">
              <li className="flex gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Professional storefront link</span>
              </li>
              <li className="flex gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Automatic pricing & service layout</span>
              </li>
              <li className="flex gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Visible service area & contact buttons</span>
              </li>
              <li className="flex gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span>High-converting mobile landing page</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
