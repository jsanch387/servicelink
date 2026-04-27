import { ROUTES } from '@/constants/routes';
import {
  BanknotesIcon,
  ChatBubbleBottomCenterTextIcon,
  LinkIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { FramedCtaButton } from '../../../components/shared/FramedCtaButton';

const DETAILER_FEATURES = [
  {
    title: 'Take Payments In-App',
    description:
      'Collect deposits or full payments right from your booking page so jobs are locked in.',
    icon: BanknotesIcon,
  },
  {
    title: 'Quote Creation Made Simple',
    description:
      'Customers can request quotes from your page and you can respond quickly with clear pricing.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    title: 'Clean Booking Link',
    description:
      'Share one professional link in your bio, texts, and DMs so customers can book without friction.',
    icon: LinkIcon,
  },
  {
    title: 'CRM That Builds Itself',
    description:
      'Every booking auto-captures customer info, helping you grow a client list without manual work.',
    icon: UserGroupIcon,
  },
] as const;

export const DetailerFeaturesSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-14 px-4 sm:px-6 border-b border-white/[0.08]">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 sm:mb-10">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">
            Why detailers choose ServiceLink
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Tools to grow your detailing business
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {DETAILER_FEATURES.map(feature => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5 sm:p-6 transition-colors duration-300 hover:border-white/[0.18]"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04] text-gray-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-10 flex justify-center">
          <FramedCtaButton href={ROUTES.AUTH.SIGNUP}>
            Set Up Your Link
          </FramedCtaButton>
        </div>
      </div>
    </section>
  );
};
