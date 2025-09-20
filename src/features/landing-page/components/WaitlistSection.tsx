import React from 'react';
import { CheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../components/shared/Button';
import { ROUTES } from '@/constants/routes';

const benefits = [
  'No credit card required',
  'Get early access to new features',
  'Exclusive launch discounts',
  'Priority customer support'
];

const stats = [
  { number: '200+', label: 'Businesses' },
  { number: '5k+', label: 'Waitlist Members' },
  { number: '100%', label: 'Free at Launch' },
];

export const WaitlistSection: React.FC = () => {
  return (
    <section id="waitlist" className="py-24 bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tighter">
          Join the Waitlist to
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
            Get Started
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Secure your spot and get a professional business profile. No credit card, no hidden fees.
        </p>

        {/* Call to Action */}
        <Button 
          href={ROUTES.WAITLIST_PAGE} 
          variant="primary"
          size="lg"
          className="mb-12"
        >
          Join the Waitlist for Free
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </Button>

        {/* Benefits and Social Proof */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-neutral-800 rounded-xl p-4 flex items-center space-x-3 border border-neutral-700">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <CheckIcon className="h-5 w-5 text-white" />
              </div>
              <p className="text-gray-400 font-semibold text-sm text-left">{benefit}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-16 p-8 bg-neutral-800 rounded-2xl border border-neutral-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
