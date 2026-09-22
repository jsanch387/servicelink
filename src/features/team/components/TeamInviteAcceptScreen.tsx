'use client';

import { Button, Input } from '@/components/shared';
import { TeamInviteJoiningState } from './TeamInviteJoiningState';
import { API_ROUTES, ROUTES, getTeamInvitePath } from '@/constants/routes';
import { useAuth } from '@/features/auth';
import { validateSignInForm, validateSignUpForm } from '@/features/auth';
import {
  AUTH_FORM_CLASS,
  AUTH_INPUT_CLASS,
  AuthFormCard,
  AuthOrDivider,
  AuthScreenLayout,
} from '@/features/auth/components/AuthScreenLayout';
import { AuthSocialButtons } from '@/features/auth/components/AuthSocialButtons';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface TeamInviteAcceptScreenProps {
  token: string;
  email: string;
  businessName: string;
}

export const TeamInviteAcceptScreen: React.FC<TeamInviteAcceptScreenProps> = ({
  token,
  email,
  businessName,
}) => {
  const router = useRouter();
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
  } = useAuth();
  const shop = businessName.trim() || 'this shop';
  const inviteNext = getTeamInvitePath(token);
  const [mode, setMode] = useState<'join' | 'signin'>('join');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const acceptInvite = async () => {
    setAccepting(true);
    setError('');
    try {
      const response = await fetch(API_ROUTES.TEAM_INVITE_ACCEPT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !result?.success) {
        setError(result?.error || 'Could not accept invite');
        return;
      }
      router.replace(ROUTES.DASHBOARD.MAIN);
      router.refresh();
    } catch {
      setError('Could not accept invite');
    } finally {
      setAccepting(false);
    }
  };

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || accepting) return;
    void acceptInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- accept once after login
  }, [isInitialized, isAuthenticated]);

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle({ next: inviteNext });
      if (result?.error) setError(result.error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setError('');
    setAppleLoading(true);
    try {
      const result = await signInWithApple({ next: inviteNext });
      if (result?.error) setError(result.error);
    } finally {
      setAppleLoading(false);
    }
  };

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const validation = validateSignUpForm({
      email,
      password,
      confirmPassword,
    });
    if (!validation.isValid) {
      setError(
        validation.errors.password ||
          validation.errors.confirmPassword ||
          validation.errors.email ||
          'Check your details'
      );
      return;
    }

    const result = await signUp(email, password, { next: inviteNext });
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsEmailVerification) {
      const q = new URLSearchParams({
        email,
        next: inviteNext,
      });
      router.push(`${ROUTES.AUTH.CHECK_EMAIL}?${q.toString()}`);
      return;
    }
    await acceptInvite();
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const validation = validateSignInForm({ email, password });
    if (!validation.isValid) {
      setError(validation.errors.password || validation.errors.email || '');
      return;
    }
    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      return;
    }
    await acceptInvite();
  };

  const showJoining = !isInitialized || (isAuthenticated && !error);

  if (showJoining) {
    return <TeamInviteJoiningState />;
  }

  if (isAuthenticated && error) {
    return (
      <AuthScreenLayout
        title="Could not join"
        subtitle={`This invite is for ${shop}.`}
        footer={null}
      >
        <AuthFormCard>
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <Button
              type="button"
              variant="primary"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              onClick={() => {
                void signOut().then(() => setError(''));
              }}
            >
              Log out and continue
            </Button>
          </div>
        </AuthFormCard>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title={mode === 'join' ? 'Join the team' : 'Sign in to join'}
      subtitle={
        mode === 'join'
          ? `Create a password to join ${shop}.`
          : `Enter your password to join ${shop}.`
      }
      footer={
        mode === 'join' ? (
          <>
            Already have a login?{' '}
            <button
              type="button"
              className="cursor-pointer font-semibold text-white hover:text-gray-200"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Need an account?{' '}
            <button
              type="button"
              className="cursor-pointer font-semibold text-white hover:text-gray-200"
              onClick={() => {
                setMode('join');
                setError('');
              }}
            >
              Create a login
            </button>
          </>
        )
      }
    >
      <AuthFormCard>
        <form
          className={AUTH_FORM_CLASS}
          onSubmit={mode === 'join' ? handleJoin : handleSignIn}
        >
          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : null}
          <Input
            id="team-invite-email"
            type="email"
            label="Email"
            value={email}
            onChange={() => undefined}
            disabled
            inputClassName={AUTH_INPUT_CLASS}
          />
          <Input
            id="team-invite-password"
            type="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'join' ? 'new-password' : 'current-password'}
            inputClassName={AUTH_INPUT_CLASS}
          />
          {mode === 'join' ? (
            <Input
              id="team-invite-confirm-password"
              type="password"
              label="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              inputClassName={AUTH_INPUT_CLASS}
            />
          ) : null}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading || accepting}
            disabled={isLoading || accepting}
          >
            {mode === 'join' ? 'Create login and join' : 'Sign in and join'}
          </Button>
        </form>
        <AuthOrDivider />
        <AuthSocialButtons
          googleLoading={googleLoading}
          appleLoading={appleLoading}
          disabled={isLoading || accepting}
          onGoogle={handleGoogle}
          onApple={handleApple}
        />
      </AuthFormCard>
    </AuthScreenLayout>
  );
};
