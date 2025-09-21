'use client';

import React, { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useWaitlist } from '@/features/landing-page/hooks/useWaitlist';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const { isLoading, isSubmitted, error, successMessage, submitEmail, reset } = useWaitlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitEmail(email);
  };

  const handleBackToHome = () => {
    reset();
    setEmail('');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-4">
              You're on the waitlist!
            </h1>
            <p className="text-gray-300 mb-6">
              Thanks for joining our waitlist. We'll email you at <strong className="text-orange-400">{email}</strong> when we launch.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {successMessage}
            </p>
            <Button
              href="/"
              variant="secondary"
              className="w-full"
              onClick={handleBackToHome}
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Join Our Waitlist
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            Get early access to your FREE business profile when we launch.
          </p>
        </div>

        <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="Enter your email address"
                required
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining Waitlist...
                </div>
              ) : (
                'Join Waitlist - It\'s FREE'
              )}
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