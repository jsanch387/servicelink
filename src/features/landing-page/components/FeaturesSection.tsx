import React from 'react';
import {
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  LinkIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: <GlobeAltIcon className="h-8 w-8" />,
    title: 'Professional Profile',
    description:
      'Create a stunning business profile with a banner image, profile picture, and service area in minutes.',
  },
  {
    icon: <PhoneIcon className="h-8 w-8" />,
    title: 'Direct Customer Contact',
    description:
      'Customers can call you directly from your profile. No more missed opportunities or complicated forms.',
  },
  {
    icon: <LinkIcon className="h-8 w-8" />,
    title: 'One Link Solution',
    description:
      'Get your custom ServiceLink URL to share everywhere. Better than Linktree, built for service businesses.',
  },
  {
    icon: <DevicePhoneMobileIcon className="h-8 w-8" />,
    title: 'Mobile Perfect',
    description:
      'Your profile looks amazing on all devices. We make sure it works perfectly on mobile where most customers are.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tighter">
            Everything You Need for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
              Your Service Business
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop paying for expensive websites you don't need. Get a
            professional online presence that's designed specifically for
            service businesses.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-neutral-800 p-8 rounded-xl border border-neutral-700 transition-all duration-300 hover:scale-105"
            >
              <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center text-white mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
