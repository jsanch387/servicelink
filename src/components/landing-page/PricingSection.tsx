import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '../shared/Button';
import { ROUTES } from '@/constants/routes';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 business profile',
      'Basic customization',
      'Mobile responsive',
      'Contact forms',
      'Basic analytics',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'Best for growing businesses',
    features: [
      'Unlimited business profiles',
      'Advanced customization',
      'Priority support',
      'Advanced analytics',
      'Custom domain',
      'Social media integration',
      'Email marketing tools',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: 'per month',
    description: 'For established businesses',
    features: [
      'Everything in Pro',
      'White-label solution',
      'API access',
      'Dedicated support',
      'Custom integrations',
      'Team management',
      'Advanced reporting',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-20 bg-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Simple,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              Transparent Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your business needs. Start free and
            upgrade as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-neutral-700 rounded-2xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? 'border-orange-500 shadow-orange-500/20 scale-105'
                  : 'border-neutral-600 hover:border-neutral-500'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-300">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                href={
                  plan.name === 'Free' ? ROUTES.AUTH.SIGNUP : ROUTES.CONTACT
                }
                variant={plan.popular ? 'primary' : 'secondary'}
                size="lg"
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <p className="text-gray-400">
            Need a custom plan?{' '}
            <a
              href={ROUTES.CONTACT}
              className="text-orange-400 hover:text-orange-300 underline"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
