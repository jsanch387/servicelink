import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { ROUTES } from '@/constants/routes';
import Image from 'next/image';
import React from 'react';
import { FramedCtaButton } from '../../../components/shared/FramedCtaButton';
import { ShareableLinkDisplay } from './ShareableLinkDisplay';

const steps = [
  {
    title: 'One link. Share anywhere.',
    description:
      'You get a single link—myservicelink.app/yourbusiness. Put it in your Instagram bio, send it in DMs, add it to flyers or business cards. One link works everywhere.',
    image: null as string | null,
    imageAlt: '',
  },
  {
    title: 'List your services.',
    description:
      'Customers can clearly see what you offer and choose the service they need. From there, they move straight into booking on your schedule.',
    image: MARKETING_IMAGES.features.services,
    imageAlt: 'Services list with prices and Book now button',
  },
  {
    title: 'Handle payments in the app.',
    description:
      'Customers can pay directly in the app, and you can require a deposit to lock in serious bookings.',
    image: MARKETING_IMAGES.features.payments,
    imageAlt: 'Payment screen with deposit and pay-in-app options',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-14 sm:mb-16">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            One link. Your page. They book.
          </h2>
        </header>

        <div className="space-y-20 sm:space-y-24 md:space-y-28">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content - order alternates on large screens */}
              <div className={index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}>
                <div className="flex items-center mb-4">
                  <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/90 border border-white/20 text-black font-black text-lg">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Visual - link display for step 1, bare image for step 2, container for step 3 */}
              <div className={index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}>
                {index === 0 ? (
                  <ShareableLinkDisplay businessSlug="blacklabelauto" />
                ) : index === 1 ? (
                  <div className="w-full flex justify-center">
                    <Image
                      src={step.image!}
                      alt={step.imageAlt}
                      width={400}
                      height={800}
                      className="w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] h-auto object-contain"
                      loading="lazy"
                      quality={90}
                    />
                  </div>
                ) : (
                  <div className="w-full flex justify-center">
                    <Image
                      src={step.image!}
                      alt={step.imageAlt}
                      width={400}
                      height={800}
                      className="w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] h-auto object-contain"
                      loading="lazy"
                      quality={90}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-14 flex justify-center">
          <FramedCtaButton href={ROUTES.AUTH.SIGNUP}>
            Start Booking Smarter
          </FramedCtaButton>
        </div>
      </div>
    </section>
  );
};
