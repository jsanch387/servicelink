'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { MegaphoneIcon, TicketIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useDashboardPromoCodes } from '../hooks/useDashboardPromoCodes';
import { useDashboardSales } from '../hooks/useDashboardSales';
import type { PromoCode, Sale } from '../types';
import { MarketingDeleteConfirmModal } from './MarketingDeleteConfirmModal';
import { MarketingEmptyState } from './MarketingEmptyState';
import { MarketingPageSkeleton } from './MarketingPageSkeleton';
import { MarketingToggleErrorBanner } from './MarketingToggleErrorBanner';
import { PromoCodesTab } from './PromoCodesTab';
import { SalesTab } from './SalesTab';

type TabType = 'promo-codes' | 'sales';

type DeleteTarget =
  | { type: 'promo-codes'; id: string; label: string }
  | { type: 'sales'; id: string; label: string };

export const MarketingPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('promo-codes');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    promoCodes,
    loadStatus: promoLoadStatus,
    loadError: promoLoadError,
    reloadPromoCodes,
    togglePromoCodeActive,
    togglingId: togglingPromoId,
    toggleError: promoToggleError,
    clearToggleError: clearPromoToggleError,
    deletePromoCode,
  } = useDashboardPromoCodes();
  const {
    sales,
    loadStatus: salesLoadStatus,
    loadError: salesLoadError,
    reloadSales,
    toggleSaleActive,
    togglingId: togglingSaleId,
    toggleError: salesToggleError,
    clearToggleError: clearSalesToggleError,
    deleteSale,
  } = useDashboardSales();

  const isInitialLoading =
    promoLoadStatus === 'loading' || salesLoadStatus === 'loading';

  const loadError = promoLoadError ?? salesLoadError;

  const activeToggleError =
    activeTab === 'promo-codes' ? promoToggleError : salesToggleError;
  const clearActiveToggleError =
    activeTab === 'promo-codes' ? clearPromoToggleError : clearSalesToggleError;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    clearPromoToggleError();
    clearSalesToggleError();
  };

  const handleEditPromoCode = (promoCode: PromoCode) => {
    router.push(ROUTES.DASHBOARD.MARKETING_PROMO_CODE_EDIT(promoCode.id));
  };

  const handleEditSale = (sale: Sale) => {
    router.push(ROUTES.DASHBOARD.MARKETING_SALE_EDIT(sale.id));
  };

  const handleDeletePromoCode = (promoCode: PromoCode) => {
    setDeleteModalError(null);
    setDeleteTarget({
      type: 'promo-codes',
      id: promoCode.id,
      label: promoCode.code,
    });
  };

  const handleDeleteSale = (sale: Sale) => {
    setDeleteModalError(null);
    setDeleteTarget({
      type: 'sales',
      id: sale.id,
      label: sale.name,
    });
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteModalError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteModalError(null);

    try {
      if (deleteTarget.type === 'promo-codes') {
        await deletePromoCode(deleteTarget.id);
      } else {
        await deleteSale(deleteTarget.id);
      }
      setDeleteTarget(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete item';
      setDeleteModalError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasPromoCodes = promoCodes.length > 0;
  const hasSales = sales.length > 0;

  if (isInitialLoading) {
    return <MarketingPageSkeleton />;
  }

  const deleteTitle =
    deleteTarget?.type === 'promo-codes'
      ? 'Delete promo code?'
      : 'Delete sale?';

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Marketing</h1>
            <p className="mt-2 text-gray-400">
              Create promo codes and sales to attract and retain customers
            </p>
          </div>

          {loadError ? (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-300">{loadError}</p>
              <Button
                onClick={() => {
                  void reloadPromoCodes();
                  void reloadSales();
                }}
                variant="ghost"
                size="xs"
                className="mt-2 text-red-200"
              >
                Try again
              </Button>
            </div>
          ) : null}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <Button
              href={ROUTES.DASHBOARD.MARKETING_PROMO_CODES_NEW}
              variant="primary"
              size="md"
              icon={<TicketIcon className="h-5 w-5" />}
              fullWidth
              className="sm:w-auto"
            >
              New Promo Code
            </Button>
            <Button
              href={ROUTES.DASHBOARD.MARKETING_SALES_NEW}
              variant="secondary"
              size="md"
              icon={<MegaphoneIcon className="h-5 w-5" />}
              fullWidth
              className="sm:w-auto"
            >
              New Sale
            </Button>
          </div>

          <div className="mb-6 border-b border-white/10">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabChange('promo-codes')}
                className={`cursor-pointer whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'promo-codes'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'
                }`}
              >
                Promo Codes
                {hasPromoCodes && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                    {promoCodes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('sales')}
                className={`cursor-pointer whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'sales'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-300'
                }`}
              >
                Sales
                {hasSales && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">
                    {sales.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {activeTab === 'promo-codes' && (
            <>
              {activeToggleError ? (
                <MarketingToggleErrorBanner
                  message={activeToggleError}
                  onDismiss={clearActiveToggleError}
                />
              ) : null}
              {hasPromoCodes ? (
                <PromoCodesTab
                  promoCodes={promoCodes}
                  onToggleActive={(id, isActive) => {
                    void togglePromoCodeActive(id, isActive);
                  }}
                  onEdit={handleEditPromoCode}
                  onDelete={handleDeletePromoCode}
                  togglingId={togglingPromoId}
                />
              ) : (
                <MarketingEmptyState type="promo-codes" />
              )}
            </>
          )}

          {activeTab === 'sales' && (
            <>
              {activeToggleError ? (
                <MarketingToggleErrorBanner
                  message={activeToggleError}
                  onDismiss={clearActiveToggleError}
                />
              ) : null}
              {hasSales ? (
                <SalesTab
                  sales={sales}
                  onToggleActive={(id, isActive) => {
                    void toggleSaleActive(id, isActive);
                  }}
                  onEdit={handleEditSale}
                  onDelete={handleDeleteSale}
                  togglingId={togglingSaleId}
                />
              ) : (
                <MarketingEmptyState type="sales" />
              )}
            </>
          )}
        </div>
      </div>

      <MarketingDeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTitle}
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.label}"? This cannot be undone.`
            : ''
        }
        error={deleteModalError}
        isDeleting={isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
