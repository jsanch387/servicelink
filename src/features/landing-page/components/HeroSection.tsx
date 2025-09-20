import React from 'react';
import { Button } from '../../../components/shared/Button';
import { ROUTES } from '@/constants/routes';

// Custom CSS for animations
const styleSheet = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-light {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-pulse-light {
  animation: pulse-light 3s ease-in-out infinite;
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animation-delay-200 { animation-delay: 0.2s; }
.animation-delay-400 { animation-delay: 0.4s; }
.animation-delay-600 { animation-delay: 0.6s; }

.grid-bg {
  background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}
`;

export const HeroSection: React.FC = () => {
  return (
    <>
      <style>{styleSheet}</style>
      <section className="relative w-full pt-12 pb-20 md:pt-16 md:pb-32 lg:pt-20 lg:pb-40 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 grid-bg opacity-20 bg-neutral-900"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
            {/* Text Content */}
            <div className="text-center lg:text-left animate-fadeInUp">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight tracking-tighter">
                <span className="block text-white">Your Business.</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                  One Beautiful Link.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed animate-fadeInUp animation-delay-200">
                Stop wasting money on expensive websites. Get a stunning business profile that lets customers call you directly from one beautiful link.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-fadeInUp animation-delay-400">
                <Button
                  href={ROUTES.WAITLIST_PAGE}
                  variant="primary"
                  size="lg"
                  className="px-8 py-4 text-lg font-bold shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Join Waitlist - FREE Profile
                </Button>
                <div className="flex items-center gap-6 text-gray-500 text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    No Credit Card
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse animation-delay-200"></div>
                    5 Min Setup
                  </span>
                </div>
              </div>
            </div>

            {/* Image with Subtle Orange Glow */}
            <div className="relative flex justify-center items-center w-full max-w-lg lg:max-w-none lg:w-1/2 animate-fadeInUp animation-delay-600">
              <div className="relative group transform-gpu">
  <img
   src="/service link mock 3.png"
   alt="ServiceLink Business Profile Preview"
   className="
     w-80 h-auto lg:w-[480px] 
     block transform-gpu transition-all duration-500 
     group-hover:scale-105 
     relative z-10
     drop-shadow-xl
     [filter:drop-shadow(0_0_60px_rgba(251,146,60,0.4))_drop-shadow(0_0_100px_rgba(251,146,60,0.2))]
   "
 />

              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            className="w-full h-24 text-neutral-900"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="currentColor"
            ></path>
          </svg>
        </div>
      </section>
    </>
  );
};
