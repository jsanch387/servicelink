'use client';

import { Modal } from '@/components/shared';
import { useCustomerManagement } from '@/features/customer-management/hooks/useCustomerManagement';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import React from 'react';
import { CustomerDesktopTable } from './CustomerDesktopTable';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { CustomerListEmptyState } from './CustomerListEmptyState';
import { CustomerMobileList } from './CustomerMobileList';
import { CustomerPageHeader } from './CustomerPageHeader';
import { CustomerSearchAndFilters } from './CustomerSearchAndFilters';
import { CustomerStatsRow } from './CustomerStatsRow';
import { SendBookingLinkModalBody } from './SendBookingLinkModalBody';

export const CustomerManagementPage: React.FC = () => {
  const {
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

        {filteredCustomers.length === 0 && <CustomerListEmptyState />}

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
      </div>
    </main>
  );
};
