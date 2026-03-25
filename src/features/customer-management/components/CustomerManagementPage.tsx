'use client';

import { Button, Modal } from '@/components/shared';
import { useCustomerManagement } from '@/features/customer-management/hooks/useCustomerManagement';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import React from 'react';
import { CustomerDesktopTable } from './CustomerDesktopTable';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { CustomerListEmptyState } from './CustomerListEmptyState';
import { CustomerManagementPageSkeleton } from './CustomerManagementPageSkeleton';
import { CustomerMobileList } from './CustomerMobileList';
import { CustomerPageHeader } from './CustomerPageHeader';
import { CustomerSearchAndFilters } from './CustomerSearchAndFilters';
import { CustomerStatsRow } from './CustomerStatsRow';
import { CustomersInitialEmptyState } from './CustomersInitialEmptyState';
import { SendBookingLinkModalBody } from './SendBookingLinkModalBody';

export const CustomerManagementPage: React.FC = () => {
  const {
    loadStatus,
    loadError,
    reloadCustomers,
    customers,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    filteredCustomers,
    stats,
    selectedCustomer,
    setSelectedCustomer,
    activeSendLinkCustomer,
    setActiveSendLinkCustomer,
    templateMessage,
    setTemplateMessage,
    deleteCustomer,
  } = useCustomerManagement();

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        {loadStatus === 'loading' && <CustomerManagementPageSkeleton />}

        {loadStatus === 'error' && (
          <>
            <CustomerPageHeader />
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-gray-300">{loadError}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void reloadCustomers()}
                className="shrink-0"
              >
                Try again
              </Button>
            </div>
          </>
        )}

        {loadStatus === 'ready' && (
          <>
            <CustomerPageHeader />

            <CustomerStatsRow stats={stats} />

            <CustomerSearchAndFilters
              query={query}
              onQueryChange={setQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            <p className="text-xs text-gray-400 mb-3">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>

            {customers.length > 0 && (
              <>
                <CustomerDesktopTable
                  customers={filteredCustomers}
                  onRowClick={setSelectedCustomer}
                  onSendLink={setActiveSendLinkCustomer}
                />

                <CustomerMobileList
                  customers={filteredCustomers}
                  onOpenDetail={setSelectedCustomer}
                  onSendLink={setActiveSendLinkCustomer}
                />
              </>
            )}

            {customers.length === 0 && <CustomersInitialEmptyState />}

            {customers.length > 0 && filteredCustomers.length === 0 && (
              <CustomerListEmptyState />
            )}

            {selectedCustomer && (
              <CustomerDetailPanel
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                onSendLink={() => {
                  setSelectedCustomer(null);
                  setActiveSendLinkCustomer(selectedCustomer);
                }}
                onDeleteCustomer={() => deleteCustomer(selectedCustomer)}
                formatCurrency={formatCustomerCurrency}
              />
            )}

            <Modal
              isOpen={Boolean(activeSendLinkCustomer)}
              onClose={() => setActiveSendLinkCustomer(null)}
              title="Send Booking Link"
              maxWidth="lg"
            >
              {activeSendLinkCustomer && (
                <SendBookingLinkModalBody
                  customer={activeSendLinkCustomer}
                  templateMessage={templateMessage}
                  onTemplateMessageChange={setTemplateMessage}
                  onClose={() => setActiveSendLinkCustomer(null)}
                />
              )}
            </Modal>
          </>
        )}
      </div>
    </main>
  );
};
