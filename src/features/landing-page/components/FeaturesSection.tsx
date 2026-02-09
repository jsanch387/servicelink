import {
  DevicePhoneMobileIcon,
  LinkIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

const features = [
  {
    icon: <PhoneIcon className="h-8 w-8" />,
    title: 'Customers Call You Directly',
    description:
      'No more missed calls. Customers click one button and call you right away. No complicated contact forms.',
  },
  {
    icon: <LinkIcon className="h-8 w-8" />,
    title: 'One Link, Share Everywhere',
    description:
      'Get your custom ServiceLink URL and share it on social media, business cards, and anywhere you want customers to find you.',
  },
  {
    icon: <DevicePhoneMobileIcon className="h-8 w-8" />,
    title: 'Works Perfect on Mobile',
    description:
      'Most customers use their phones. Your profile looks amazing on all devices, especially mobile.',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-24 bg-[var(--dashboard-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tighter">
            How ServiceLink
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
              Works
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Three simple things that make your business more successful
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="relative group">
              {/* Frosted Glass Card */}
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 text-center flex flex-col h-full">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-lg">
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-4 min-h-[3rem] flex items-center justify-center">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <div className="flex-1 flex items-start">
                    <p className="text-gray-300 leading-relaxed text-sm w-full">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
