'use client';

import React, { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Log the captured information
    console.log('Waitlist signup:', {
      email,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    });

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              You're on the waitlist!
            </h1>
            <p className="text-gray-300 mb-6">
              Thanks for joining our waitlist. We'll email you at <strong>{email}</strong> when we launch.
            </p>
            <Button
              href="/"
              variant="secondary"
              className="w-full"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Join Our Waitlist
          </h1>
          <p className="text-lg text-gray-300">
            Get early access to your FREE business profile when we launch.
          </p>
        </div>

        <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email address"
                required
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Waitlist - It\'s FREE'}
            </Button>

            <p className="text-center text-sm text-gray-400">
              ✓ No spam • ✓ Cancel anytime • ✓ No credit card required
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-700">
            <div className="flex items-center justify-center space-x-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400">
              Trusted by 200+ businesses already on our waitlist
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Button
            href="/"
            variant="secondary"
            size="sm"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
