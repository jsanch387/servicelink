'use client';

import { Button, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '../utils/validation';

export const ForgotPasswordForm: React.FC = () => {
  const { requestPasswordReset, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    const result = await requestPasswordReset(email.trim());
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  const layoutClass =
    'min-h-[100dvh] bg-neutral-900 flex items-center justify-center py-6 px-4 pb-[env(safe-area-inset-bottom)] sm:py-8 sm:px-6 md:py-10 lg:py-12 lg:px-8';
  const containerClass =
    'w-full max-w-[min(100%,26rem)] sm:max-w-[28rem] md:max-w-[30rem]';
  const inputSizeClass =
    'py-3.5 px-4 text-base min-h-[48px] sm:min-h-[52px] rounded-xl';

  if (sent) {
    return (
      <div className={layoutClass}>
        <div className={`${containerClass} space-y-6 sm:space-y-8 text-left`}>
          <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl md:text-4xl">
            Check your email
          </h1>
          <p className="text-base text-gray-400 leading-relaxed">
            We sent a password reset link to{' '}
            <strong className="text-gray-300">{email}</strong>. Click the link
            to set a new password. If you don&apos;t see it, check your spam
            folder.
          </p>
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="inline-block text-base font-medium text-orange-400 hover:text-orange-300"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={layoutClass}>
      <div className={`${containerClass} space-y-6 sm:space-y-8`}>
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl md:text-4xl">
            Forgot your password?
          </h1>
          <p className="mt-2 text-base text-gray-400 sm:mt-2.5">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>

        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-base">{error}</p>
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="Enter your email"
            autoComplete="email"
            required
            inputClassName={inputSizeClass}
          />

          <Button
            type="submit"
            variant="inverse"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>

          <p className="text-center text-base text-gray-400">
            <Link
              href={ROUTES.AUTH.LOGIN}
              className="font-medium text-orange-400 hover:text-orange-300"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
