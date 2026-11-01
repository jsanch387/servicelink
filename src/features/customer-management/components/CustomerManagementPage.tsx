'use client';

import {
  Button,
  ListPagination,
  Modal,
  listPageCount,
  listPageItems,
} from '@/components/shared';
import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { ROUTES } from '@/constants/routes';
import { DEMO_NEEDS_ATTENTION_CUSTOMER } from '@/features/customer-management/constants/demoNeedsAttentionCustomer';
import { useCustomerManagement } from '@/features/customer-management/hooks/useCustomerManagement';
import { isCustomerNeedsAttention } from '@/features/customer-management/utils/customerAttention';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { CustomerDesktopTable } from './CustomerDesktopTable';
import { AddCustomerModalBody } from './AddCustomerModalBody';
import { CustomerListEmptyState } from './CustomerListEmptyState';
import { CustomerManagementPageSkeleton } from './CustomerManagementPageSkeleton';
import { CustomerMobileList } from './CustomerMobileList';
import { CustomerSearchAndFilters } from './CustomerSearchAndFilters';
import { ImportCustomersModal } from './ImportCustomersModal';
import { CustomersInitialEmptyState } from './CustomersInitialEmptyState';

/** Phone cards stay short. The desktop table has room for a longer page. */
const CUSTOMER_PAGE_SIZE_MOBILE = 10;
const CUSTOMER_PAGE_SIZE_DESKTOP = 20;
const DESKTOP_TABLE_QUERY = '(min-width: 768px)';

function subscribeDesktopTable(onStoreChange: () => void): () => void {
  const mq = window.matchMedia(DESKTOP_TABLE_QUERY);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function desktopTableSnapshot(): boolean {
  return window.matchMedia(DESKTOP_TABLE_QUERY).matches;
}

function useDesktopCustomerTable(): boolean {
  return useSyncExternalStore(
    subscribeDesktopTable,
    desktopTableSnapshot,
    () => false
  );
}

export const CustomerManagementPage: React.FC = () => {
  const router = useRouter();
  const canWriteCustomers = useDashboardAccess().can('customers.write');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] =
    React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [addCustomerModalBusy, setAddCustomerModalBusy] = React.useState(false);
  const {
    loadStatus,
    loadError,
    reloadCustomers,
    customers,
    businessType,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    filteredCustomers,
    createCustomer,
  } = useCustomerManagement();
  const hasAnyRealDueCustomers = customers.some(isCustomerNeedsAttention);
  const shouldShowNeedsAttentionDemo =
    statusFilter === 'needs_attention' &&
    filteredCustomers.length === 0 &&
    !hasAnyRealDueCustomers;
  const customersForDisplay = shouldShowNeedsAttentionDemo
    ? [DEMO_NEEDS_ATTENTION_CUSTOMER]
    : filteredCustomers;
  const isDesktopTable = useDesktopCustomerTable();
  const pageSize = isDesktopTable
    ? CUSTOMER_PAGE_SIZE_DESKTOP
    : CUSTOMER_PAGE_SIZE_MOBILE;
  const [page, setPage] = useState(0);
  const pageCount = listPageCount(customersForDisplay.length, pageSize);
  const currentPage = Math.min(page, pageCount - 1);
  const pageCustomers = listPageItems(
    customersForDisplay,
    currentPage,
    pageSize
  );

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full min-w-0 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          {loadStatus === 'loading' && <CustomerManagementPageSkeleton />}

          {loadStatus === 'error' && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
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
          )}

          {loadStatus === 'ready' && (
            <>
              <CustomerSearchAndFilters
                query={query}
                onQueryChange={setQuery}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onAddCustomer={
                  canWriteCustomers
                    ? () => setIsAddCustomerModalOpen(true)
                    : undefined
                }
                onImport={
                  canWriteCustomers ? () => setIsImportOpen(true) : undefined
                }
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
                    onRowClick={customer =>
                      router.push(ROUTES.DASHBOARD.CUSTOMER(customer.id))
                    }
                  />

                  <CustomerMobileList
                    customers={pageCustomers}
                    onOpenDetail={customer =>
                      router.push(ROUTES.DASHBOARD.CUSTOMER(customer.id))
                    }
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
                  <CustomersInitialEmptyState
                    onAddCustomer={
                      canWriteCustomers
                        ? () => setIsAddCustomerModalOpen(true)
                        : undefined
                    }
                  />
                ))}

              {customers.length > 0 &&
                filteredCustomers.length === 0 &&
                !shouldShowNeedsAttentionDemo && (
                  <CustomerListEmptyState statusFilter={statusFilter} />
                )}

              {canWriteCustomers ? (
                <ImportCustomersModal
                  isOpen={isImportOpen}
                  onClose={() => setIsImportOpen(false)}
                  includeVehicles={isVehicleRelatedBusinessType(businessType)}
                  existingCustomers={customers.map(customer => ({
                    phone: customer.phone,
                    email: customer.email,
                  }))}
                  onImported={() => void reloadCustomers({ silent: true })}
                />
              ) : null}

              {canWriteCustomers ? (
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
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
