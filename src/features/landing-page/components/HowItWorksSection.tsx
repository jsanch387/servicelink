import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import React from 'react';
import { DisplayCard } from './DisplayCard';

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 border-t border-white/5 bg-neutral-900 space-y-24 sm:space-y-32"
    >
      {/* Highlight 1: Professionalism */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Profile Mocks Image */}
        <div className="order-2 lg:order-1 w-full min-h-[400px] sm:min-h-[500px] flex items-center justify-center">
          <DisplayCard className="w-full min-h-[400px] sm:min-h-[500px] flex items-center justify-center p-8 sm:p-10 lg:p-12">
            {/* Image - Slightly Zoomed */}
            <div className="w-full max-w-[500px] sm:max-w-[600px] lg:max-w-[700px]">
              <div className="transform scale-110 sm:scale-115 md:scale-120">
                <Image
                  src="/profile mocks 2.png"
                  alt="ServiceLink Profile Mocks"
                  width={700}
                  height={500}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                  quality={85}
                />
              </div>
            </div>
          </DisplayCard>
        </div>

        {/* Content */}
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Look like a{' '}
            <span className="text-orange-400">top-tier company</span> instantly.
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-6 sm:mb-8">
            No more sending generic DMs or relying on confusing Instagram
            Highlights. We take your business info and automatically layout a
            high-converting profile that builds immediate trust.
          </p>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <span className="text-gray-300 text-sm sm:text-base">
                Upload your logo & cover photo
              </span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
              <span className="text-gray-300 text-sm sm:text-base">
                Clean, mobile-first design (Responsive)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Highlight 2: List Services */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Content */}
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Your services and prices,{' '}
            <span className="text-orange-400">crystal clear.</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-6 sm:mb-8">
            Tired of texting the same pricing sheet over and over? List your
            services with clear starting prices. When someone asks &quot;how
            much?&quot;, just send them your link.
          </p>
          <div className="bg-white/5 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-white/10">
            <p className="text-sm italic text-gray-400 mb-4">
              &quot;Since adding my link to my bio, I spend 80% less time
              answering basic questions about pricing.&quot;
            </p>
            <p className="text-xs font-bold text-white uppercase">
              — Mobile Detailer
            </p>
          </div>
        </div>

        {/* Services Cards Display */}
        <DisplayCard className="w-full min-h-[400px] sm:min-h-[450px] flex items-center justify-center p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md space-y-4">
            {/* Mock Service Card 1 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-colors p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white pr-4 flex-1">
                  Signature Detail
                </h3>
                <span className="text-xl font-bold text-white flex-shrink-0">
                  $150
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Hand wash, wheel and tire clean, interior wipe-down, and a
                high-gloss exterior finish.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-gray-500 border border-white/10">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">2 Hours</span>
              </div>
            </div>

            {/* Mock Service Card 2 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-white/20 transition-colors p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white pr-4 flex-1">
                  Full Detail Package
                </h3>
                <span className="text-xl font-bold text-white flex-shrink-0">
                  $275
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                Complete interior and exterior detail including clay bar,
                polish, and protective wax application.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-gray-500 border border-white/10">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">4 Hours</span>
              </div>
            </div>
          </div>
        </DisplayCard>
      </div>

      {/* Highlight 3: Contact/Lead Gen */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Buttons Display */}
        <div className="order-2 lg:order-1 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[2.5rem] border border-white/5 w-full min-h-[300px] sm:min-h-[350px] md:min-h-[400px] flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-sm scale-100 sm:scale-110 md:scale-125">
            {/* Call Button - Exact match from ProfileHeader */}
            <div className="group flex items-center justify-center gap-2 sm:gap-2.5 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-[0.96] shadow-xl bg-white text-neutral-900 hover:bg-gray-100">
              <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
              Call
            </div>
            {/* Text Button - Exact match from ProfileHeader */}
            <div className="group flex items-center justify-center gap-2 sm:gap-2.5 py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all active:scale-[0.96] shadow-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
              <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110" />
              Text
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="order-1 lg:order-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 sm:mb-6 leading-tight">
            Lower the barrier to{' '}
            <span className="text-green-400">getting paid.</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed mb-6 sm:mb-8">
            The easier it is to contact you, the more jobs you land. Your
            profile puts a &quot;Call&quot; and &quot;Text&quot; button right at
            their fingertips, leading to faster bookings and less ghosting.
          </p>
          <div className="flex items-center gap-4 border-l-4 border-orange-600 pl-4 sm:pl-6">
            <p className="text-gray-300 font-medium text-sm sm:text-base">
              No complicated booking systems (yet). Just direct contact from
              high-intent customers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
