'use client';

import { Button, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateSignUpForm } from '../utils/validation';

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setAuthError('');

    // Validate form
    const validation = validateSignUpForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await signUp(formData.email, formData.password);

      if (result.error) {
        setAuthError(result.error);
        return;
      }

      // Redirect to dashboard after successful signup
      // The user will go through onboarding flow
      // Use router.refresh() to ensure middleware sees the updated session
      router.refresh();

      // Small delay to ensure cookies are set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      router.push(ROUTES.DASHBOARD.MAIN);
    } catch (error) {
      console.error('Signup failed:', error);
      setAuthError('An unexpected error occurred. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <a
              href={ROUTES.AUTH.LOGIN}
              className="font-medium text-orange-400 hover:text-orange-300"
            >
              Sign in here
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={value => handleChange('email', value)}
              error={errors.email}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={value => handleChange('password', value)}
              error={errors.password}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={value => handleChange('confirmPassword', value)}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <Link
                href="/terms"
                className="text-orange-400 hover:text-orange-300"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-orange-400 hover:text-orange-300"
              >
                Privacy Policy
              </Link>
              . You also agree to receive emails from us, including account updates, product information, and promotional communications.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
