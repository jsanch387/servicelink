'use client';

import { Logo } from '@/components/shared';
import React from 'react';

/** Shared input styling for login / signup screens */
export const AUTH_INPUT_CLASS =
  'py-3.5 px-4 text-base min-h-[48px] rounded-xl bg-black/40 border-white/10 sm:py-4 sm:px-5 sm:min-h-[56px]';

/** Form spacing + slightly larger labels on desktop */
export const AUTH_FORM_CLASS =
  'space-y-5 sm:space-y-6 [&_label]:sm:text-base [&_label]:sm:mb-2';

export function AuthFormCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 sm:rounded-2xl sm:px-8 sm:py-8 ${className}`}
    >
      {children}
    </div>
  );
}

export function AuthOrDivider() {
  return (
    <div className="relative py-1 sm:py-2">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[var(--dashboard-bg,#0a0a0a)] px-3 text-xs font-medium uppercase tracking-wider text-gray-500">
          Or
        </span>
      </div>
    </div>
  );
}

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthScreenLayout({
  title,
  subtitle,
  footer,
  children,
}: AuthScreenLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-[var(--dashboard-bg,#0a0a0a)] flex items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="w-full max-w-[26rem] sm:max-w-[30rem] flex flex-col">
        <header className="flex flex-col items-center text-center mb-6 sm:mb-8 pt-7 sm:pt-8">
          <Logo
            variant="logo"
            size="xl"
            logoSize="xl"
            className="mb-2 sm:mb-3 justify-center"
          />
          <h1 className="text-2xl sm:text-[2rem] sm:leading-tight font-bold text-white tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm sm:text-lg text-gray-400 max-w-sm">
            {subtitle}
          </p>
        </header>

        <div className="flex flex-col gap-5 sm:gap-6">{children}</div>

        <footer className="mt-5 sm:mt-6 text-center text-sm sm:text-base text-gray-400">
          {footer}
        </footer>
      </div>
    </div>
  );
}
