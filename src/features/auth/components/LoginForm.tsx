'use client';

import { Button, GoogleIcon, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateSignInForm } from '../utils/validation';

const REDIRECT_ERROR_MESSAGES: Record<string, string> = {
  email_exists_use_password:
    'This email is already registered. Please sign in with your password.',
};

export const LoginForm: React.FC<{ redirectError?: string }> = ({
  redirectError,
}) => {
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (redirectError && REDIRECT_ERROR_MESSAGES[redirectError]) {
      setAuthError(REDIRECT_ERROR_MESSAGES[redirectError]);
      router.replace(ROUTES.AUTH.LOGIN);
    }
  }, [redirectError, router]);

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
    const validation = validateSignInForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await signIn(formData.email, formData.password);

      if (result.error) {
        setAuthError(result.error);
        return;
      }

      // Redirect to dashboard after successful login
      // Use router.refresh() to ensure middleware sees the updated session
      router.refresh();

      // Small delay to ensure cookies are set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      router.push(ROUTES.DASHBOARD.MAIN);
    } catch (error) {
      console.error('Login failed:', error);
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
        <div className="text-left">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Sign in to your account
          </h2>
          <p className="mt-1.5 text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <a
              href={ROUTES.AUTH.SIGNUP}
              className="font-medium text-orange-400 hover:text-orange-300"
            >
              Create one
            </a>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {authError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-red-400 text-sm">{authError}</p>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            loading={googleLoading}
            disabled={isLoading || googleLoading}
            onClick={handleGoogleSignIn}
            icon={<GoogleIcon className="h-4 w-4" />}
            iconPosition="left"
          >
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-neutral-900 px-2 text-gray-400">
                Or sign in with email
              </span>
            </div>
          </div>

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
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-orange-400 hover:text-orange-300"
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
};
