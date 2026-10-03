'use client';

import {
  Button,
  ListPagination,
  Modal,
  listPageCount,
  listPageItems,
} from '@/components/shared';
import { DEMO_NEEDS_ATTENTION_CUSTOMER } from '@/features/customer-management/constants/demoNeedsAttentionCustomer';
import { useCustomerManagement } from '@/features/customer-management/hooks/useCustomerManagement';
import { isCustomerNeedsAttention } from '@/features/customer-management/utils/customerAttention';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import React, { useEffect, useState } from 'react';
import { AddCustomerModalBody } from './AddCustomerModalBody';
import { CustomerDesktopTable } from './CustomerDesktopTable';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { CustomerListEmptyState } from './CustomerListEmptyState';
import { CustomerManagementPageSkeleton } from './CustomerManagementPageSkeleton';
import { CustomerMobileList } from './CustomerMobileList';
import { CustomerPageHeader } from './CustomerPageHeader';
import { CustomerSearchAndFilters } from './CustomerSearchAndFilters';
import { CustomersInitialEmptyState } from './CustomersInitialEmptyState';
import { DeleteCustomerModalBody } from './DeleteCustomerModalBody';

const CUSTOMER_PAGE_SIZE = 10;

interface CustomerManagementPageProps {
  hasProCheckInAccess: boolean;
}

export const CustomerManagementPage: React.FC<CustomerManagementPageProps> = ({
  hasProCheckInAccess,
}) => {
  const canWriteCustomers = useDashboardAccess().can('customers.write');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] =
    React.useState(false);
  const [addCustomerModalBusy, setAddCustomerModalBusy] = React.useState(false);
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
    selectedCustomer,
    setSelectedCustomer,
    activeDeleteCustomer,
    setActiveDeleteCustomer,
    isDeletingCustomer,
    deleteCustomerError,
    isSavingNote,
    saveNoteError,
    setSaveNoteError,
    openDeleteCustomerModal,
    confirmDeleteCustomer,
    saveCustomerNote,
    createCustomer,
    openCustomerSms,
  } = useCustomerManagement();
  const hasAnyRealDueCustomers = customers.some(isCustomerNeedsAttention);
  const shouldShowNeedsAttentionDemo =
    statusFilter === 'needs_attention' &&
    filteredCustomers.length === 0 &&
    !hasAnyRealDueCustomers;
  const customersForDisplay = shouldShowNeedsAttentionDemo
    ? [DEMO_NEEDS_ATTENTION_CUSTOMER]
    : filteredCustomers;
  const [page, setPage] = useState(0);
  const pageCount = listPageCount(
    customersForDisplay.length,
    CUSTOMER_PAGE_SIZE
  );
  const currentPage = Math.min(page, pageCount - 1);
  const pageCustomers = listPageItems(
    customersForDisplay,
    currentPage,
    CUSTOMER_PAGE_SIZE
  );

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
              <CustomerPageHeader
                onAddCustomer={
                  canWriteCustomers
                    ? () => setIsAddCustomerModalOpen(true)
                    : undefined
                }
              />

              <CustomerSearchAndFilters
                query={query}
                onQueryChange={setQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />

              {shouldShowNeedsAttentionDemo ? (
                <p className="text-xs text-amber-300/90 mb-3">
                  No customers are currently due. Customers who haven&apos;t
                  booked in 90+ days will show here.
                </p>
              ) : null}

              {customersForDisplay.length > 0 && (
                <>
                  <CustomerDesktopTable
                    customers={pageCustomers}
                    onRowClick={setSelectedCustomer}
                  />

                  <CustomerMobileList
                    customers={pageCustomers}
                    onOpenDetail={setSelectedCustomer}
                  />

                  <ListPagination
                    page={currentPage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                  />
                </>
              )}

              {customers.length === 0 &&
                !shouldShowNeedsAttentionDemo &&
                (statusFilter === 'needs_attention' ? (
                  <CustomerListEmptyState statusFilter={statusFilter} />
                ) : (
                  <CustomersInitialEmptyState />
                ))}

              {customers.length > 0 &&
                filteredCustomers.length === 0 &&
                !shouldShowNeedsAttentionDemo && (
                  <CustomerListEmptyState statusFilter={statusFilter} />
                )}

              {selectedCustomer && (
                <CustomerDetailPanel
                  customer={selectedCustomer}
                  hasProCheckInAccess={hasProCheckInAccess}
                  onClose={() => setSelectedCustomer(null)}
                  onMessageCustomer={mode => {
                    openCustomerSms(selectedCustomer, mode);
                  }}
                  onDeleteCustomer={
                    canWriteCustomers
                      ? () => openDeleteCustomerModal(selectedCustomer)
                      : undefined
                  }
                  onSaveNote={
                    canWriteCustomers
                      ? note => saveCustomerNote(selectedCustomer.id, note)
                      : undefined
                  }
                  isSavingNote={isSavingNote}
                  saveNoteError={saveNoteError}
                  onDismissSaveNoteError={() => setSaveNoteError(null)}
                  formatCurrency={formatCustomerCurrency}
                />
              )}

              {canWriteCustomers ? (
                <>
                  <Modal
                    isOpen={isAddCustomerModalOpen}
                    onClose={() => setIsAddCustomerModalOpen(false)}
                    title="Add customer"
                    maxWidth="sm"
                    preventClose={addCustomerModalBusy}
                  >
                    <AddCustomerModalBody
                      onClose={() => setIsAddCustomerModalOpen(false)}
                      onBusyChange={setAddCustomerModalBusy}
                      createCustomer={createCustomer}
                    />
                  </Modal>

                  <Modal
                    isOpen={Boolean(activeDeleteCustomer)}
                    onClose={() => {
                      if (!isDeletingCustomer) {
                        setActiveDeleteCustomer(null);
                      }
                    }}
                    title="Delete customer"
                    maxWidth="sm"
                  >
                    {activeDeleteCustomer && (
                      <DeleteCustomerModalBody
                        customer={activeDeleteCustomer}
                        isDeleting={isDeletingCustomer}
                        error={deleteCustomerError}
                        onConfirm={() => void confirmDeleteCustomer()}
                        onClose={() => setActiveDeleteCustomer(null)}
                      />
                    )}
                  </Modal>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
