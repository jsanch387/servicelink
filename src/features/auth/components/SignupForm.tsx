'use client';

import { Button, Input } from '@/components/shared';
import {
  markMetaLeadPending,
  trackMetaLeadOnce,
} from '@/features/analytics/utils/metaLeadTracking';
import { completeWorkshopSignupTracking } from '@/features/ads-workshop/utils/completeWorkshopSignupTracking';
import { captureWorkshopAttributionFromUrl } from '@/features/ads-workshop/utils/workshopAttribution';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateSignUpForm } from '../utils/validation';
import {
  AUTH_FORM_CLASS,
  AUTH_INPUT_CLASS,
  AuthFormCard,
  AuthOrDivider,
  AuthScreenLayout,
} from './AuthScreenLayout';
import { AuthGoogleButton } from './AuthSocialButtons';

const authFooterLinkClass =
  'font-semibold text-white hover:text-gray-200 transition-colors';

export const SignupForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp, signInWithGoogle, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string>('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    captureWorkshopAttributionFromUrl(searchParams);
  }, [searchParams]);

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

      if (result.needsEmailVerification) {
        markMetaLeadPending();
        const q = result.email
          ? `?email=${encodeURIComponent(result.email)}`
          : '';
        router.push(`${ROUTES.AUTH.CHECK_EMAIL}${q}`);
        return;
      }

      trackMetaLeadOnce();
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 100));
      completeWorkshopSignupTracking(formData.email);
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
      title="Create your account"
      subtitle="Sign up to manage your business."
      footer={
        <>
          Already have an account?{' '}
          <Link href={ROUTES.AUTH.LOGIN} className={authFooterLinkClass}>
            Log in
          </Link>
        </>
      }
    >
      <AuthFormCard>
        <form className={AUTH_FORM_CLASS} onSubmit={handleSubmit}>
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
            autoComplete="new-password"
            required
            inputClassName={AUTH_INPUT_CLASS}
          />

          <Input
            label="Confirm password"
            type="password"
            value={formData.confirmPassword}
            onChange={value => handleChange('confirmPassword', value)}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            autoComplete="new-password"
            required
            inputClassName={AUTH_INPUT_CLASS}
          />

          <Button
            type="submit"
            variant="inverse"
            fullWidth
            size="lg"
            loading={isLoading}
            disabled={isLoading || googleLoading}
            className="sm:min-h-[56px] sm:text-base"
          >
            {isLoading ? 'Creating account' : 'Sign up'}
          </Button>

          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed text-center">
            By creating an account, you agree to our{' '}
            <Link
              href="/terms"
              className="text-gray-400 underline hover:text-gray-300"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="text-gray-400 underline hover:text-gray-300"
            >
              Privacy Policy
            </Link>
            .
          </p>
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
