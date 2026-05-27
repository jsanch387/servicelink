'use client';

import { CheckCircleIcon } from '@heroicons/react/24/solid';
import React from 'react';
import type { AutomationDmMessage } from '../automationCopy';
import {
  AUTOMATION_DEMO_CUSTOMER_LABEL,
  AUTOMATION_DEMO_SHOP_LABEL,
} from '../automationCopy';

type AutomationDmThreadProps = {
  messages: readonly AutomationDmMessage[];
  outcome?: string;
};

export const AutomationDmThread: React.FC<AutomationDmThreadProps> = ({
  messages,
  outcome,
}) => {
  return (
    <div className="mt-3.5">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-3.5 py-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium tracking-wide text-gray-500">
            Instagram DM · live preview
          </span>
        </div>

        <div className="space-y-2.5 px-3 py-3 sm:px-3.5">
          {messages.map((message, index) => {
            const isCustomer = message.from === 'customer';
            return (
              <div
                key={`${message.from}-${index}`}
                className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both ${
                  isCustomer ? 'items-start' : 'items-end'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="mb-0.5 px-1 text-[10px] font-medium text-gray-600">
                  {isCustomer
                    ? AUTOMATION_DEMO_CUSTOMER_LABEL
                    : AUTOMATION_DEMO_SHOP_LABEL}
                </span>
                <p
                  className={`max-w-[88%] px-3 py-2 text-[13px] leading-snug sm:text-sm ${
                    isCustomer
                      ? 'rounded-2xl rounded-tl-md bg-neutral-800/90 text-gray-200'
                      : 'rounded-2xl rounded-tr-md border border-emerald-500/30 bg-emerald-500/10 text-gray-100'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {outcome ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2.5 text-left">
          <CheckCircleIcon
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
            aria-hidden
          />
          <p className="text-sm leading-snug text-emerald-100/90">{outcome}</p>
        </div>
      ) : null}
    </div>
  );
};
