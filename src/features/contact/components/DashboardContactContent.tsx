'use client';

import { ROUTES } from '@/constants/routes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import { ContactForm } from './ContactForm';

export type DashboardContactContentProps = {
  accountEmail: string;
};

export const DashboardContactContent: React.FC<
  DashboardContactContentProps
> = ({ accountEmail }) => {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-lg mx-auto w-full min-w-0">
        <Link
          href={ROUTES.DASHBOARD.SETTINGS}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden />
          Settings
        </Link>

        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Contact support
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            We&apos;ll reply to{' '}
            <span className="text-gray-400">{accountEmail}</span> within 24
            hours.
          </p>
        </header>

        <ContactForm variant="inApp" accountEmail={accountEmail} />
      </div>
    </main>
  );
};
