'use client';

import { Button, GlassCard, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateSignInForm } from '../utils/validation';
import {
  AUTH_INPUT_CLASS,
  AuthFormCard,
  AuthOrDivider,
  AuthScreenLayout,
} from './AuthScreenLayout';
import { AuthGoogleButton } from './AuthSocialButtons';

const REDIRECT_ERROR_MESSAGES: Record<string, string> = {
  email_exists_use_password:
    'This email is already registered. Please sign in with your password.',
};

const authFooterLinkClass =
  'font-semibold text-white hover:text-gray-200 transition-colors';

export const LoginForm: React.FC<{
  redirectError?: string;
  resetSuccess?: boolean;
  loginNotice?: string;
}> = ({ redirectError, resetSuccess, loginNotice }) => {
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

  const emailVerifiedLoginNotice = loginNotice === 'email_confirm_open_login';

  useEffect(() => {
    if (resetSuccess) router.replace(ROUTES.AUTH.LOGIN);
  }, [resetSuccess, router]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result?.error) setAuthError(result.error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setAuthError('');

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
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push(ROUTES.DASHBOARD.MAIN);
    } catch {
      setAuthError('An unexpected error occurred. Please try again.');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Log in to manage your business."
      footer={
        <>
          New to ServiceLink?{' '}
          <Link href={ROUTES.AUTH.SIGNUP} className={authFooterLinkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <AuthFormCard>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {emailVerifiedLoginNotice ? (
            <GlassCard rounded="rounded-xl" padding="sm">
              <div className="flex items-start gap-3">
                <CheckCircleIcon
                  className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white tracking-tight">
                    Email verified
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-zinc-400 sm:text-sm">
                    Sign in to continue.
                  </p>
                </div>
              </div>
            </GlassCard>
          ) : null}

          {resetSuccess && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
              <p className="text-sm text-green-400">
                Your password has been updated. You can sign in now.
              </p>
            </div>
          )}

          {authError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{authError}</p>
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={value => handleChange('email', value)}
            error={errors.email}
            placeholder="you@company.com"
            autoComplete="email"
            required
            inputClassName={AUTH_INPUT_CLASS}
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
            inputClassName={AUTH_INPUT_CLASS}
          />

          <div className="flex justify-end">
            <Link
              href={ROUTES.AUTH.FORGOT_PASSWORD}
              className="text-sm font-medium text-white hover:text-gray-200 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="inverse"
            fullWidth
            size="lg"
            loading={isLoading}
            disabled={isLoading || googleLoading}
            className="rounded-full"
          >
            {isLoading ? 'Signing in…' : 'Login'}
          </Button>
        </form>
      </AuthFormCard>

      <AuthOrDivider />

      <AuthGoogleButton
        onGoogle={handleGoogleSignIn}
        googleLoading={googleLoading}
        disabled={isLoading}
      />
    </AuthScreenLayout>
  );
};
