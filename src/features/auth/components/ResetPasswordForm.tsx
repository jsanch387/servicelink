'use client';

import { Button, Input } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { createClient } from '@/libs/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { validatePassword } from '../utils/validation';

function parseHashParams(hash: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!hash || hash.charAt(0) !== '#') return params;
  const query = hash.slice(1);
  query.split('&').forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) params[key] = decodeURIComponent(value);
  });
  return params;
}

export const ResetPasswordForm: React.FC = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();

    const initSession = async () => {
      const params = parseHashParams(window.location.hash);
      if (params.type === 'recovery' && params.access_token && params.refresh_token) {
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) {
            setSessionError('This link is invalid or has expired. Please request a new one.');
            setSessionReady(true);
            return;
          }
          // Clear hash from URL without reload
          window.history.replaceState(null, '', window.location.pathname);
        } catch {
          setSessionError('Something went wrong. Please request a new reset link.');
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          window.history.replaceState(null, '', window.location.pathname);
        } else {
          setSessionError('This link is invalid or has expired. Please request a new one.');
        }
      }
      setSessionReady(true);
    };

    initSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    setConfirmError('');

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.errors[0]);
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      router.push(`${ROUTES.AUTH.LOGIN}?reset=success`);
    } catch {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center py-12 px-4">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-left">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Link expired or invalid
          </h2>
          <p className="text-sm text-gray-400">{sessionError}</p>
          <Link
            href={ROUTES.AUTH.FORGOT_PASSWORD}
            className="inline-block text-sm font-medium text-orange-400 hover:text-orange-300"
          >
            Request a new reset link
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
            Set new password
          </h2>
          <p className="mt-1.5 text-sm text-gray-400">
            Enter your new password below.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Input
            label="New password"
            type="password"
            value={password}
            onChange={setPassword}
            error={passwordError}
            placeholder="Enter new password"
            autoComplete="new-password"
            required
          />

          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={confirmError}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update password'}
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
