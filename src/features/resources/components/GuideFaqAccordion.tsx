import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { h2Classes, sectionClasses } from '../content/guideContentStyles';

export type GuideFaqItem = {
  question: string;
  answer: React.ReactNode;
};

type GuideFaqAccordionProps = {
  items: readonly GuideFaqItem[];
  heading?: string;
};

export function GuideFaqAccordion({
  items,
  heading = 'Frequently Asked Questions',
}: GuideFaqAccordionProps) {
  if (!items.length) return null;

  return (
    <section className={sectionClasses} aria-labelledby="guide-faq-heading">
      <h2 id="guide-faq-heading" className={h2Classes}>
        {heading}
      </h2>
      <div className="space-y-2">
        {items.map(item => (
          <details
            key={item.question}
            className="group border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02] open:bg-white/[0.03]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left marker:content-none [&::-webkit-details-marker]:hidden hover:bg-white/[0.03] transition-colors">
              <span className="font-medium text-white text-sm sm:text-base pr-2 leading-snug">
                {item.question}
              </span>
              <ChevronDownIcon
                className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
              <div className="text-gray-400 text-sm sm:text-base leading-relaxed [&_a]:text-gray-300 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white">
                {item.answer}
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
