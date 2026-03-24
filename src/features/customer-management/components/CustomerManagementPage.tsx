'use client';

import { Button, GlassCard, Input, Modal } from '@/components/shared';
import { MOCK_CUSTOMERS } from '@/features/customer-management/mockCustomers';
import type {
  CustomerLifecycle,
  CustomerRecord,
} from '@/features/customer-management/types';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import {
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { CustomerStatusBadge } from './CustomerStatusBadge';

const STATUS_FILTERS: Array<{
  label: string;
  value: 'all' | CustomerLifecycle;
}> = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Returning', value: 'returning' },
];

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

const formatCount = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);

/** Mobile list only: colored text, no badge box (detail panel + desktop use CustomerStatusBadge). */
function mobileListStatusStyle(status: CustomerLifecycle): {
  label: string;
  className: string;
} {
  if (status === 'returning') {
    return { label: 'Returning', className: 'text-emerald-400 font-medium' };
  }
  return { label: 'New', className: 'text-sky-400 font-medium' };
}

const matchesQuery = (customer: CustomerRecord, query: string): boolean => {
  const searchable = [
    customer.name,
    customer.email,
    customer.phone,
    customer.lastService,
    ...(customer.lastBookingAddOns ?? []),
    customer.note,
  ]
    .join(' ')
    .toLowerCase();
  return searchable.includes(query.toLowerCase().trim());
};

export const CustomerManagementPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerRecord[]>(MOCK_CUSTOMERS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerLifecycle>(
    'all'
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [activeSendLinkCustomer, setActiveSendLinkCustomer] =
    useState<CustomerRecord | null>(null);
  const [templateMessage, setTemplateMessage] = useState(
    "Hey there, hope you're doing well!\nHere’s my booking link if you’d like to schedule your next appointment:\n\nmyservicelink.app/businessname"
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const passesStatus =
        statusFilter === 'all' || customer.status === statusFilter;
      const passesSearch = !query.trim() || matchesQuery(customer, query);
      return passesStatus && passesSearch;
    });
  }, [customers, query, statusFilter]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const returningCustomers = customers.filter(
      customer => customer.status === 'returning'
    ).length;
    const totalRevenue = customers.reduce(
      (sum, customer) => sum + customer.totalSpent,
      0
    );

    return {
      totalCustomers,
      returningCustomers,
      totalRevenue,
    };
  }, [customers]);

  const handleDeleteCustomer = (customer: CustomerRecord): void => {
    const confirmed = window.confirm(
      `Delete ${customer.name} from your customer list?`
    );
    if (!confirmed) {
      return;
    }

    setCustomers(prev => prev.filter(item => item.id !== customer.id));
    setSelectedCustomer(null);
    if (activeSendLinkCustomer?.id === customer.id) {
      setActiveSendLinkCustomer(null);
    }
  };

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Customers
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Manage your customers and booking activity.
          </p>
        </div>

        <div className="mb-5 sm:mb-6 border-t border-white/10 pt-4 sm:pt-5">
          <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 sm:gap-y-2 text-xs">
            <div
              className="inline-flex items-baseline gap-2 whitespace-nowrap"
              title={`${stats.totalCustomers} total customers`}
            >
              <span className="text-gray-500">Customers</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatCount(stats.totalCustomers)}
              </span>
            </div>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <div
              className="inline-flex items-baseline gap-2 whitespace-nowrap"
              title={`${stats.returningCustomers} returning customers`}
            >
              <span className="text-gray-500">Returning</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatCount(stats.returningCustomers)}
              </span>
            </div>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <div
              className="inline-flex items-baseline gap-2 whitespace-nowrap"
              title={`${formatCurrency(stats.totalRevenue)} total revenue`}
            >
              <span className="text-gray-500">Revenue</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatCurrency(stats.totalRevenue)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-5">
          <div className="flex flex-col gap-3">
            <Input
              value={query}
              onChange={setQuery}
              placeholder="Search by name, service, phone, email..."
              className="w-full"
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              inputMode="search"
            />
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(filter => {
                const isActive = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/15 text-gray-300 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>

        <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Last booked
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Visits
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Total spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Tag
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr
                  key={customer.id}
                  className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="px-4 py-3 align-middle">
                    <p className="text-base font-semibold text-white tracking-tight">
                      {customer.name}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle min-w-[10rem]">
                    <p className="text-sm text-gray-200">
                      {formatLastBookedDate(customer.lastBookingDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {customer.lastBookingDaysAgo} days ago
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-200 align-middle tabular-nums">
                    {customer.totalVisits}{' '}
                    {customer.totalVisits === 1 ? 'visit' : 'visits'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-200 align-middle tabular-nums font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <CustomerStatusBadge status={customer.status} />
                  </td>
                  <td
                    className="px-4 py-3 align-middle"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSendLinkCustomer(customer)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      <PaperAirplaneIcon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Send link</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {filteredCustomers.map(customer => {
            const statusUi = mobileListStatusStyle(customer.status);
            return (
              <GlassCard
                key={customer.id}
                rounded="rounded-2xl"
                className="p-4 border border-white/10"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-white tracking-tight">
                        {customer.name}
                      </p>
                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                        <span className={statusUi.className}>
                          {statusUi.label}
                        </span>
                        <span
                          className="h-3 w-px shrink-0 bg-white/20"
                          aria-hidden
                        />
                        <span className="min-w-0">
                          {customer.totalVisits}{' '}
                          {customer.totalVisits === 1 ? 'visit' : 'visits'}{' '}
                          total
                        </span>
                        <span
                          className="h-3 w-px shrink-0 bg-white/20"
                          aria-hidden
                        />
                        <span className="shrink-0 tabular-nums text-gray-500">
                          Spent {formatCurrency(customer.totalSpent)}
                        </span>
                      </div>
                    </div>
                    <EllipsisHorizontalIcon
                      className="h-5 w-5 shrink-0 text-gray-500"
                      aria-hidden
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3 text-xs">
                      <span className="shrink-0 text-gray-500">
                        Last booked:
                      </span>
                      <span className="min-w-0 truncate font-medium text-gray-200">
                        {formatLastBookedDate(customer.lastBookingDate)}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-gray-500">
                      {customer.lastBookingDaysAgo}d ago
                    </span>
                  </div>
                </button>

                <div className="mt-3 border-t border-white/10 pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveSendLinkCustomer(customer)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    <PaperAirplaneIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Send link</span>
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {selectedCustomer && (
          <CustomerDetailPanel
            customer={selectedCustomer}
            onClose={() => setSelectedCustomer(null)}
            onSendLink={() => {
              setSelectedCustomer(null);
              setActiveSendLinkCustomer(selectedCustomer);
            }}
            onDeleteCustomer={() => handleDeleteCustomer(selectedCustomer)}
            formatCurrency={formatCurrency}
          />
        )}

        {filteredCustomers.length === 0 && (
          <GlassCard rounded="rounded-2xl" className="p-6 mt-3 text-center">
            <p className="text-sm text-gray-300">
              No customers match your current filters.
            </p>
          </GlassCard>
        )}

        <Modal
          isOpen={Boolean(activeSendLinkCustomer)}
          onClose={() => setActiveSendLinkCustomer(null)}
          title="Send Booking Link"
          maxWidth="lg"
        >
          {activeSendLinkCustomer && (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-500">To</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {activeSendLinkCustomer.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeSendLinkCustomer.phone}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">Message</p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(templateMessage);
                    }}
                    className="inline-flex items-center justify-center rounded-md border border-white/10 p-1.5 text-gray-300 hover:text-white hover:border-white/25 transition-colors"
                    aria-label="Copy message"
                    title="Copy message"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={templateMessage}
                  onChange={e => setTemplateMessage(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setActiveSendLinkCustomer(null)}
                  icon={
                    <PaperAirplaneIcon className="h-4 w-4 text-emerald-400" />
                  }
                  className="text-sm font-semibold"
                >
                  Send SMS
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveSendLinkCustomer(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
};
