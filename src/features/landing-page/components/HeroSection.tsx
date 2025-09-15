import React from 'react';
import { Button } from '../../../components/shared/Button';
import { ROUTES } from '@/constants/routes';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="home"
      className="relative bg-neutral-900 py-20 sm:py-32 lg:py-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className="text-left">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Stop Wasting Money on
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                Expensive Websites
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              Small service businesses don't need complex websites. Get a professional online presence that's 
              better than Linktree, designed specifically for service businesses. Let customers call you directly 
              from one beautiful link.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button
                href={ROUTES.WAITLIST_PAGE}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Join Waitlist - FREE Profile
              </Button>
              {/* <Button
                href="#waitlist"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Learn More
              </Button> */}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8 text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Setup in under 5 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">Mobile optimized</span>
              </div>
            </div>
          </div>

          {/* Right Side - Image/Preview */}
          <div className="flex justify-center lg:justify-end">
            <div className="bg-neutral-800 rounded-2xl p-3 sm:p-4 shadow-2xl border border-neutral-600">
              <div className="w-64 h-[400px] sm:w-80 sm:h-[500px] bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl flex items-center justify-center border border-neutral-600">
                <div className="text-center text-gray-400 p-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-600 rounded-lg mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-base sm:text-lg font-medium">Mobile Preview</p>
                  <p className="text-xs sm:text-sm mt-2">Coming Soon</p>
                  <p className="text-xs mt-3 sm:mt-4 text-gray-500 max-w-40 sm:max-w-48">
                    See how your business profile will look on mobile devices
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full h-16 text-neutral-800"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
            opacity=".25"
            fill="currentColor"
          />
          <path
            d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
            opacity=".5"
            fill="currentColor"
          />
          <path
            d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
};
