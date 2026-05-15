'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { createClient } from '@/libs/supabase/client';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

function authEmailRedirectTo(): string {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
  return `${baseUrl}${ROUTES.AUTH.CALLBACK}?next=${encodeURIComponent(
    ROUTES.AUTH.EMAIL_CONFIRMED
  )}`;
}

export interface CheckYourEmailScreenProps {
  /** Email from query after sign-up (may be empty if opened directly). */
  email?: string;
}

/**
 * Post sign-up: user must confirm email before signing in (Supabase session is null until then).
 */
export const CheckYourEmailScreen: React.FC<CheckYourEmailScreenProps> = ({
  email,
}) => {
  const trimmed = email?.trim() ?? '';
  const hasEmail = trimmed.length > 0;

  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendOk, setResendOk] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setInterval(
      () => setResendCooldown(s => Math.max(0, s - 1)),
      1000
    );
    return () => window.clearInterval(id);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (!trimmed || resendLoading || resendCooldown > 0) return;
    setResendError(null);
    setResendOk(false);
    setResendLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: trimmed,
        options: { emailRedirectTo: authEmailRedirectTo() },
      });
      if (error) {
        setResendError(error.message);
        return;
      }
      setResendOk(true);
      setResendCooldown(60);
    } finally {
      setResendLoading(false);
    }
  }, [trimmed, resendLoading, resendCooldown]);

  return (
    <div className="min-h-[100dvh] bg-neutral-900 flex items-center justify-center py-6 px-4 pb-[env(safe-area-inset-bottom)] sm:py-8 sm:px-6">
      <div className="w-full max-w-[min(100%,26rem)] sm:max-w-md space-y-5 text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
          <EnvelopeIcon className="h-6 w-6 text-zinc-300" aria-hidden />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-400 sm:text-base">
            {hasEmail ? (
              <>
                We sent a confirmation link to{' '}
                <span className="font-medium text-zinc-200">{trimmed}</span>.
              </>
            ) : (
              <>We sent a confirmation link to the email you used to sign up.</>
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Not seeing it? Check your spam or promotions folder.
          </p>

          {hasEmail ? (
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className="text-sm font-medium text-orange-400 hover:text-orange-300 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {resendLoading
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend email (${resendCooldown}s)`
                    : 'Resend email'}
              </button>
              {resendError ? (
                <p className="text-sm text-red-400">{resendError}</p>
              ) : null}
              {resendOk && !resendError ? (
                <p className="text-sm text-emerald-400/90">Email sent again.</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-zinc-400">
              <Link
                href={ROUTES.AUTH.SIGNUP}
                className="font-medium text-orange-400 hover:text-orange-300"
              >
                Back to sign up
              </Link>{' '}
              if you need a different address.
            </p>
          )}
        </div>

        <Button
          href={ROUTES.AUTH.LOGIN}
          variant="inverse"
          fullWidth
          className="font-semibold"
        >
          Back to login
        </Button>
      </div>
    </div>
  );
};
