import React from 'react';

export const WhyUsSection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-8 sm:mb-10 md:mb-12 tracking-tight px-2">
          Why pros choose us over a website.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 text-left">
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-lg sm:text-xl font-bold text-orange-400">
              Websites are 2005.
            </h4>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Websites are slow, they don't look good on phones, and they cost
              $1,500+ to build properly. Most customers just want your number
              and your location—we give them that in 0.2 seconds.
            </p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-lg sm:text-xl font-bold text-orange-400">
              Social Bios are for hobbyists.
            </h4>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              If you're still saying "DM me for info," you're losing customers
              to the guy with the 'Call Now' button. Look like a real business,
              not a side hustle.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
