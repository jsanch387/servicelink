'use client';

import { Button, GlassCard } from '@/components/shared';
import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { ROUTES } from '@/constants/routes';
import { ChangeAccountEmailModal } from '@/features/account';
import { useAuth } from '@/features/auth';
import {
  ArrowRightStartOnRectangleIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

const compactLinkClass =
  'flex min-h-[40px] items-center gap-2.5 py-2 text-sm text-gray-400 transition-colors hover:text-white group cursor-pointer';

interface SettingsCompactLinkProps {
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsCompactLink: React.FC<SettingsCompactLinkProps> = ({
  href,
  external = false,
  icon,
  children,
}) => {
  const content = (
    <>
      <span className="shrink-0 opacity-70 group-hover:opacity-100">
        {icon}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 opacity-40 group-hover:opacity-70" />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={compactLinkClass}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={compactLinkClass}>
      {content}
    </Link>
  );
};

export type EmailChangeNotice = 'updated' | 'error' | null;

export interface SettingsAccountSectionProps {
  accountEmail?: string;
  signedInWithGoogle?: boolean;
  /** Pending email from Supabase while a change awaits confirmation. */
  pendingEmail?: string | null;
  /** From `?email_notice=` after auth callback. */
  emailNotice?: EmailChangeNotice;
}

export const SettingsAccountSection: React.FC<SettingsAccountSectionProps> = ({
  accountEmail,
  signedInWithGoogle = false,
  pendingEmail: pendingEmailProp = null,
  emailNotice = null,
}) => {
  const router = useRouter();
  const { signOut, updateUser } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(
    pendingEmailProp
  );
  const [notice, setNotice] = useState<EmailChangeNotice>(emailNotice);

  useEffect(() => {
    setPendingEmail(pendingEmailProp);
  }, [pendingEmailProp]);

  useEffect(() => {
    if (!emailNotice) return;
    setNotice(emailNotice);
    if (emailNotice === 'updated') {
      setPendingEmail(null);
      if (accountEmail) void updateUser({ email: accountEmail });
    }
    // Clear the query param so refresh doesn't re-show the banner.
    router.replace(ROUTES.DASHBOARD.SETTINGS, { scroll: false });

    const el = document.getElementById('settings-account');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [emailNotice, accountEmail, updateUser, router]);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const result = await signOut();
      if (result.success) router.push('/');
    } catch {
      // ignore
    } finally {
      setLogoutLoading(false);
    }
  }, [signOut, router]);

  const handleEmailRequested = useCallback((nextPending: string) => {
    setPendingEmail(nextPending);
    setNotice(null);
  }, []);

  if (!accountEmail) return null;

  return (
    <section id="settings-account" className="w-full min-w-0 space-y-3">
      <ChangeAccountEmailModal
        isOpen={changeOpen}
        onClose={() => setChangeOpen(false)}
        currentEmail={accountEmail}
        signedInWithGoogle={signedInWithGoogle}
        onRequested={handleEmailRequested}
      />

      <h2 className="text-base font-semibold text-white">Account</h2>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full min-w-0 p-4 text-left"
      >
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          {signedInWithGoogle
            ? 'You signed in with Google. You can still update the email used for account notices.'
            : 'The email you use to sign in and receive account updates.'}
        </p>

        {notice === 'updated' ? (
          <div
            className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-200"
            role="status"
          >
            Your email has been updated.
          </div>
        ) : null}

        {notice === 'error' ? (
          <div
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200 leading-relaxed"
            role="alert"
          >
            We couldn&apos;t confirm that email change. The link may have
            expired — try updating your email again.
          </div>
        ) : null}

        <div
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 min-w-0"
          title={accountEmail}
        >
          <p className="font-mono text-[13px] leading-snug text-gray-200 break-all sm:text-sm">
            {accountEmail}
          </p>
        </div>

        {pendingEmail && notice !== 'updated' ? (
          <div className="mt-2.5 flex gap-2" role="status">
            <InformationCircleIcon
              className="mt-0.5 h-4 w-4 shrink-0 text-sky-400"
              aria-hidden
            />
            <p className="min-w-0 text-sm leading-snug text-gray-400">
              We&apos;ve sent a confirmation email to{' '}
              <span className="font-medium text-white break-all">
                {pendingEmail}
              </span>
              .
            </p>
          </div>
        ) : null}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setChangeOpen(true)}
          className="mt-3 w-full sm:w-auto"
        >
          Update email
        </Button>

        <div className="mt-4 border-t border-white/10 pt-3 space-y-0.5">
          <SettingsCompactLink
            href={ROUTES.DASHBOARD.CONTACT}
            icon={<EnvelopeIcon className="h-4 w-4" aria-hidden />}
          >
            Contact support
          </SettingsCompactLink>
          {IOS_APP_STORE_URL ? (
            <SettingsCompactLink
              href={IOS_APP_STORE_URL}
              external
              icon={<DevicePhoneMobileIcon className="h-4 w-4" aria-hidden />}
            >
              iPhone app
            </SettingsCompactLink>
          ) : null}
        </div>
      </GlassCard>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleLogout}
        loading={logoutLoading}
        disabled={logoutLoading}
        icon={
          <ArrowRightStartOnRectangleIcon className="h-4 w-4" aria-hidden />
        }
        className="w-full sm:w-auto"
      >
        Log out
      </Button>
    </section>
  );
};
