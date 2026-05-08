'use client';

import { Button, Modal } from '@/components/shared';
import { DEMO_NEEDS_ATTENTION_CUSTOMER } from '@/features/customer-management/constants/demoNeedsAttentionCustomer';
import { useCustomerManagement } from '@/features/customer-management/hooks/useCustomerManagement';
import { isCustomerNeedsAttention } from '@/features/customer-management/utils/customerAttention';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { AddCustomerModalBody } from './AddCustomerModalBody';
import { CustomerDesktopTable } from './CustomerDesktopTable';
import { CustomerDetailPanel } from './CustomerDetailPanel';
import { CustomerListEmptyState } from './CustomerListEmptyState';
import { CustomerManagementPageSkeleton } from './CustomerManagementPageSkeleton';
import { CustomerMobileList } from './CustomerMobileList';
import { CustomerPageHeader } from './CustomerPageHeader';
import { CustomerSearchAndFilters } from './CustomerSearchAndFilters';
import { CustomerStatsRow } from './CustomerStatsRow';
import { CustomersInitialEmptyState } from './CustomersInitialEmptyState';
import { DeleteCustomerModalBody } from './DeleteCustomerModalBody';

interface CustomerManagementPageProps {
  hasProCheckInAccess: boolean;
}

export const CustomerManagementPage: React.FC<CustomerManagementPageProps> = ({
  hasProCheckInAccess,
}) => {
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
    stats,
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
  const shownCount = customersForDisplay.length;

  return (
    <main className="flex-1 pt-8 pb-28 sm:pt-10 sm:pb-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
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
            <CustomerPageHeader
              onAddCustomer={() => setIsAddCustomerModalOpen(true)}
            />

            <CustomerStatsRow stats={stats} />

            <CustomerSearchAndFilters
              query={query}
              onQueryChange={setQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            <p className="text-xs text-gray-400 mb-3">
              Showing {shownCount} of {customers.length} customers
            </p>
            {shouldShowNeedsAttentionDemo ? (
              <p className="text-xs text-amber-300/90 mb-3">
                No customers are currently due. Customers who haven&apos;t
                booked in 90+ days will show here.
              </p>
            ) : null}

            {customersForDisplay.length > 0 && (
              <>
                <CustomerDesktopTable
                  customers={customersForDisplay}
                  onRowClick={setSelectedCustomer}
                />

                <CustomerMobileList
                  customers={customersForDisplay}
                  onOpenDetail={setSelectedCustomer}
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
                onDeleteCustomer={() =>
                  openDeleteCustomerModal(selectedCustomer)
                }
                onSaveNote={note => saveCustomerNote(selectedCustomer.id, note)}
                isSavingNote={isSavingNote}
                saveNoteError={saveNoteError}
                onDismissSaveNoteError={() => setSaveNoteError(null)}
                formatCurrency={formatCustomerCurrency}
              />
            )}

            <div
              className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm sm:hidden safe-area-pb"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              <div className="mx-auto w-full max-w-6xl">
                <Button
                  variant="inverse"
                  fullWidth
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  icon={<PlusIcon className="h-4 w-4" aria-hidden />}
                  aria-label="Add a customer"
                >
                  Add a customer
                </Button>
              </div>
            </div>

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
        )}
      </div>
    </main>
  );
};
