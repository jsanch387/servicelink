'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { LANDING_FAQS } from '../data/faqs';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 border-t border-white/[0.06]"
    >
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12 sm:mb-14">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">
            FAQ
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Common questions
          </h2>
        </header>

        <div className="space-y-2">
          {LANDING_FAQS.map((faq, index) => (
            <div
              key={index}
              className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left hover:bg-white/[0.03] transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-white text-sm sm:text-base pr-2">
                  {faq.question}
                </span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 sm:px-6 pb-4 sm:pb-5 pt-0">
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
