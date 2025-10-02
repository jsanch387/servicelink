'use client';

import { Button, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateSignInForm } from '../utils/validation';

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string>('');

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
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <a
              href={ROUTES.AUTH.SIGNUP}
              className="font-medium text-orange-400 hover:text-orange-300"
            >
              create a new account
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
            size="lg"
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
