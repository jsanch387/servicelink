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

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-left">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Check your email
          </h2>
          <p className="text-sm text-gray-400">
            We sent a password reset link to{' '}
            <strong className="text-gray-300">{email}</strong>. Click the link
            to set a new password. If you don&apos;t see it, check your spam
            folder.
          </p>
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="inline-block text-sm font-medium text-orange-400 hover:text-orange-300"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-left">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Forgot your password?
          </h2>
          <p className="mt-1.5 text-sm text-gray-400">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
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
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>

          <p className="text-center text-sm text-gray-400">
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
