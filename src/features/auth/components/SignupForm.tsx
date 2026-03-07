'use client';

import { Button, GoogleIcon, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateSignUpForm } from '../utils/validation';

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.error) {
        setAuthError(result.error);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

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

  const inputSizeClass =
    'py-3.5 px-4 text-base min-h-[48px] sm:min-h-[52px] rounded-xl';

  return (
    <div className="min-h-[100dvh] bg-neutral-900 flex items-center justify-center py-6 px-4 pb-[env(safe-area-inset-bottom)] sm:py-8 sm:px-6 md:py-10 lg:py-12 lg:px-8">
      <div className="w-full max-w-[min(100%,26rem)] sm:max-w-[28rem] md:max-w-[30rem] space-y-6 sm:space-y-8">
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl md:text-4xl">
            Create your account
          </h1>
          <p className="mt-2 text-base text-gray-400 sm:mt-2.5 sm:text-base">
            Already have an account?{' '}
            <a
              href={ROUTES.AUTH.LOGIN}
              className="font-medium text-orange-400 hover:text-orange-300"
            >
              Sign in here
            </a>
          </p>
        </div>

        <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-4">
              <p className="text-red-400 text-base sm:text-base">{authError}</p>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            loading={googleLoading}
            disabled={isLoading || googleLoading}
            onClick={handleGoogleSignIn}
            icon={<GoogleIcon className="h-5 w-5" />}
            iconPosition="left"
          >
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm sm:text-base">
              <span className="bg-neutral-900 px-3 text-gray-400">
                Or sign up with email
              </span>
            </div>
          </div>

          <div className="space-y-5 sm:space-y-6">
            <Input
              label="Email address"
              type="email"
              value={formData.email}
              onChange={value => handleChange('email', value)}
              error={errors.email}
              placeholder="Enter your email"
              autoComplete="email"
              required
              inputClassName={inputSizeClass}
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
              inputClassName={inputSizeClass}
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
              inputClassName={inputSizeClass}
            />
          </div>

          <Button
            type="submit"
            variant="inverse"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>

          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link
                href="/terms"
                className="font-medium text-orange-400 hover:text-orange-300"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="font-medium text-orange-400 hover:text-orange-300"
              >
                Privacy Policy
              </Link>
              . You also agree to receive emails from us, including account
              updates, product information, and promotional communications.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
