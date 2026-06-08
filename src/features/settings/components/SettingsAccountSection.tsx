'use client';

import { Button, GlassCard } from '@/components/shared';
import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth';
import {
  ArrowRightStartOnRectangleIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';

const compactLinkClass =
  'flex min-h-[40px] items-center gap-2.5 py-2 text-sm text-gray-400 transition-colors hover:text-white group';

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

export interface SettingsAccountSectionProps {
  accountEmail?: string;
  signedInWithGoogle?: boolean;
}

export const SettingsAccountSection: React.FC<SettingsAccountSectionProps> = ({
  accountEmail,
  signedInWithGoogle = false,
}) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  if (!accountEmail) return null;

  return (
    <section className="w-full min-w-0 space-y-4">
      <h2 className="text-lg sm:text-xl font-semibold text-white">Account</h2>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full min-w-0 p-4 text-left"
      >
        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          {signedInWithGoogle
            ? 'You signed in with Google. Your email is managed there.'
            : 'The email you use to sign in and receive account updates.'}
        </p>

        <div
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 min-w-0"
          title={accountEmail}
        >
          <p className="font-mono text-[13px] leading-snug text-gray-200 break-all sm:text-sm">
            {accountEmail}
          </p>
        </div>

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
