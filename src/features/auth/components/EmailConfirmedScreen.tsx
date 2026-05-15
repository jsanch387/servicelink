'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return ROUTES.DASHBOARD.MAIN;
  }
  return raw;
}

/**
 * Shown after email confirmation when the verify link lands in `/auth/callback`
 * with `next=/auth/email-confirmed`. Same-browser flow sets the session there;
 * another browser skips session setup and should use login instead.
 */
export const EmailConfirmedScreen: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isInitialized } = useAuth();

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get('next')),
    [searchParams]
  );
  const slSignup = searchParams.get('sl_signup');

  const continueHref =
    slSignup === '1'
      ? `${nextPath}${nextPath.includes('?') ? '&' : '?'}sl_signup=1`
      : nextPath;

  const sessionReady = isInitialized && !isLoading && !!user;

  return (
    <div className="min-h-[100dvh] bg-neutral-900 flex items-center justify-center py-6 px-4 pb-[env(safe-area-inset-bottom)] sm:py-8 sm:px-6">
      <div className="w-full max-w-[min(100%,26rem)] sm:max-w-md space-y-5 text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
          <CheckCircleIcon className="h-7 w-7 text-emerald-400" aria-hidden />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl">
            Email confirmed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400 sm:text-base">
            {sessionReady ? (
              <>You&apos;re signed in. Continue when you&apos;re ready.</>
            ) : (
              <>Sign in with the same email and password you used to sign up.</>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {sessionReady ? (
            <Button
              type="button"
              variant="inverse"
              fullWidth
              className="font-semibold"
              onClick={() => router.push(continueHref)}
            >
              Continue to dashboard
            </Button>
          ) : (
            <>
              <Button
                href={ROUTES.AUTH.LOGIN}
                variant="inverse"
                fullWidth
                className="font-semibold"
              >
                Sign in
              </Button>
              <p className="text-center text-xs text-zinc-500">
                <Link
                  href="/"
                  className="font-medium text-zinc-400 hover:text-zinc-300"
                >
                  Back to home
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
