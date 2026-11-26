import {
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import React from 'react';
import { MockPrimaryButton, MockStatusBar, MockStatusPill } from './mockUi';
import { SAMPLE_CUSTOMERS, SAMPLE_JOBS, SAMPLE_SHOP } from './sampleShop';

const SCREEN = 'flex h-full flex-col bg-[#0F0F0F] pb-5 text-white';

export function OwnerJobsScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          Today
        </p>
        <p className="mt-1 text-[17px] font-semibold tracking-tight text-white">
          3 jobs · $682
        </p>
        <p className="mt-4 text-[12px] font-semibold text-white">Thursday</p>
        <ul className="mt-2 flex flex-col gap-2">
          {SAMPLE_JOBS.map(job => (
            <li
              key={job.customer}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-white">
                  {job.customer}
                </p>
                <MockStatusPill>{job.status}</MockStatusPill>
              </div>
              <dl className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">Time</dt>
                  <dd className="tabular-nums text-zinc-200">{job.time}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-400">Service</dt>
                  <dd className="truncate text-zinc-200">{job.service}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function OwnerJobDetailScreen() {
  const job = SAMPLE_JOBS[0];
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Next job
            </p>
            <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-white">
              {job.customer}
            </h2>
          </div>
          <MockStatusPill>{job.status}</MockStatusPill>
        </div>
        <dl className="mt-5 space-y-3 text-[12px]">
          <div className="flex justify-between gap-3 border-b border-white/[0.06] pb-3">
            <dt className="text-zinc-500">Service</dt>
            <dd className="text-right text-zinc-200">
              {job.service}
              <span className="mt-0.5 block text-[11px] text-zinc-500">
                {job.vehicle}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-b border-white/[0.06] pb-3">
            <dt className="text-zinc-500">Time</dt>
            <dd className="tabular-nums text-zinc-200">Thu · {job.time}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Address</dt>
            <dd className="max-w-[9rem] text-right leading-snug text-zinc-200">
              {job.address}
            </dd>
          </div>
        </dl>
        <div className="mt-auto pt-4">
          <MockPrimaryButton>Mark complete</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function SmsThreadScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-4">
        <p className="mb-4 text-center text-[11px] font-medium text-zinc-500">
          {SAMPLE_SHOP.name}
        </p>
        <p className="mb-3 text-center text-[10px] text-zinc-600">
          Thursday 11:18 AM
        </p>
        <div className="space-y-2.5">
          <p className="max-w-[88%] rounded-2xl bg-white/[0.08] px-3.5 py-2.5 text-[12px] leading-snug text-zinc-100">
            You&apos;re booked — Thu 11:30 AM. We&apos;ll text when we&apos;re
            on the way.
          </p>
          <p className="max-w-[88%] rounded-2xl bg-white/[0.08] px-3.5 py-2.5 text-[12px] leading-snug text-zinc-100">
            On the way. ETA 12 min.
          </p>
          <p className="ml-auto max-w-[70%] rounded-2xl bg-white px-3.5 py-2.5 text-[12px] leading-snug text-black">
            Gate code 4412
          </p>
        </div>
        <div className="mt-auto flex items-center gap-2 pb-5 pt-4">
          <div className="h-8 flex-1 rounded-full border border-white/10 bg-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}

export function CrmDesktopScreen() {
  return (
    <div className="flex min-h-[280px] bg-[#0F0F0F] sm:min-h-[320px]">
      <div
        className="flex w-9 shrink-0 flex-col items-center gap-4 border-r border-white/[0.06] py-4"
        aria-hidden
      >
        <CalendarDaysIcon className="h-4 w-4 text-zinc-500" />
        <UsersIcon className="h-4 w-4 text-white" />
        <DevicePhoneMobileIcon className="h-4 w-4 text-zinc-500" />
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Customers
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-white">
              {SAMPLE_SHOP.name}
            </p>
          </div>
          <p className="text-[11px] text-zinc-500">3 clients</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {['Customer', 'Vehicle', 'Visits', 'Spent'].map(label => (
                  <th
                    key={label}
                    className="px-3 py-2.5 text-[10px] font-medium text-white/60 sm:px-4"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAMPLE_CUSTOMERS.map(customer => (
                <tr
                  key={customer.name}
                  className="border-b border-white/[0.06] last:border-0"
                >
                  <td className="px-3 py-3 text-[12px] font-semibold tracking-tight text-white sm:px-4">
                    {customer.name}
                  </td>
                  <td className="px-3 py-3 text-[11px] text-zinc-400 sm:px-4">
                    {customer.vehicle}
                  </td>
                  <td className="px-3 py-3 text-[11px] tabular-nums text-zinc-300 sm:px-4">
                    {customer.visits}
                  </td>
                  <td className="px-3 py-3 text-[11px] tabular-nums text-zinc-300 sm:px-4">
                    {customer.spent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
