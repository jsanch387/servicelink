import { ROUTES } from '@/constants/routes';
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { Button } from '../../../components/shared/Button';

const benefits = [
  {
    title: 'Save Money',
    description:
      'Stop paying $200+ per month for websites. Get everything you need with simple, transparent pricing.',
    icon: <CurrencyDollarIcon className="h-6 w-6" />,
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: '5 Minute Setup',
    description:
      "No complicated setup. Just add your info, upload photos, and you're ready to go in minutes.",
    icon: <ClockIcon className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'More Customers',
    description:
      'Professional profiles get more customers. Show your work, list your services, and let customers contact you directly.',
    icon: <CheckIcon className="h-6 w-6" />,
    color: 'from-orange-500 to-red-600',
  },
];

const comparison = [
  { feature: 'Setup Time', serviceLink: '5 minutes', traditional: '2-4 weeks' },
  {
    feature: 'Monthly Cost',
    serviceLink: 'Simple pricing',
    traditional: '$200+',
  },
  {
    feature: 'Mobile Friendly',
    serviceLink: 'Perfect',
    traditional: 'Often broken',
  },
  {
    feature: 'Customer Calls',
    serviceLink: 'Direct calls',
    traditional: 'Contact forms only',
  },
  { feature: 'Updates', serviceLink: 'Easy', traditional: 'Need developer' },
];

export const BenefitsSection: React.FC = () => {
  return (
    <section className="py-24 bg-[var(--dashboard-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tighter">
            Why ServiceLink is
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
              Perfect for You
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Everything you need to look professional and get more customers, all
            in one simple link.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="relative group">
              {/* Frosted Glass Card */}
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20 text-center flex flex-col h-full">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-r ${benefit.color} rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-lg`}
                  >
                    {benefit.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-4">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="relative group">
          {/* Frosted Glass Card */}
          <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-8 text-center">
                ServiceLink vs. Traditional Websites
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-300 py-4 px-4">
                        Feature
                      </th>
                      <th className="text-center text-orange-400 py-4 px-4 font-semibold">
                        ServiceLink
                      </th>
                      <th className="text-center text-gray-300 py-4 px-4">
                        Traditional Website
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="text-white py-4 px-4 font-medium">
                          {item.feature}
                        </td>
                        <td className="text-center text-green-400 py-4 px-4 font-semibold">
                          {item.serviceLink}
                        </td>
                        <td className="text-center text-gray-300 py-4 px-4">
                          {item.traditional}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="relative group max-w-4xl mx-auto">
            {/* Frosted Glass Card */}
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 transition-all duration-300 hover:bg-white/10 hover:border-white/20">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h3>
                <p className="text-gray-300 text-lg mb-8">
                  Join thousands of service businesses who have simplified their
                  online presence and increased their bookings.
                </p>

                <Button
                  href={ROUTES.AUTH.SIGNUP}
                  variant="primary"
                  className="px-8 py-4 text-lg font-bold shadow-lg transform transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Get Your Business Profile
                </Button>

                <div className="flex flex-wrap justify-center gap-6 text-gray-300 text-sm mt-6">
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    No credit card to start
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    5 Min Setup
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
