import React from 'react';
import {
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: <GlobeAltIcon className="h-8 w-8" />,
    title: 'Professional Profile',
    description:
      'Create a stunning business profile that showcases your brand, services, and work portfolio.',
  },
  {
    icon: <DevicePhoneMobileIcon className="h-8 w-8" />,
    title: 'Mobile First',
    description:
      'Optimized for all devices. Your customers can easily browse and contact you from anywhere.',
  },
  {
    icon: <ClockIcon className="h-8 w-8" />,
    title: 'Quick Setup',
    description:
      'Get your business online in under 5 minutes. No technical skills required.',
  },
  {
    icon: <ChartBarIcon className="h-8 w-8" />,
    title: 'Analytics & Insights',
    description:
      'Track visitor engagement and understand what drives customer interest.',
  },
  {
    icon: <ShieldCheckIcon className="h-8 w-8" />,
    title: 'Secure & Reliable',
    description:
      'Built with enterprise-grade security. Your data and customer information is protected.',
  },
  {
    icon: <LinkIcon className="h-8 w-8" />,
    title: 'One Link Solution',
    description:
      'Share a single link across all your social media platforms and marketing materials.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Everything You Need to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Grow Your Business
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our platform provides all the tools service-based businesses need to
            establish a strong online presence and connect with customers
            effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-neutral-700 p-8 rounded-xl border border-neutral-600 hover:border-neutral-500 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/20 group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
