'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { MegaphoneIcon, TicketIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useMarketingStore } from '../stores/marketingStore';
import { MarketingEmptyState } from './MarketingEmptyState';
import { PromoCodesTab } from './PromoCodesTab';
import { SalesTab } from './SalesTab';
import type { PromoCode, Sale } from '../types';

type TabType = 'promo-codes' | 'sales';

export const MarketingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('promo-codes');
  const promoCodes = useMarketingStore(state => state.promoCodes);
  const togglePromoCodeActive = useMarketingStore(
    state => state.togglePromoCodeActive
  );
  const deletePromoCode = useMarketingStore(state => state.deletePromoCode);
  const sales = useMarketingStore(state => state.sales);
  const toggleSaleActive = useMarketingStore(state => state.toggleSaleActive);
  const deleteSale = useMarketingStore(state => state.deleteSale);

  const handleTogglePromoCodeActive = (id: string, isActive: boolean) => {
    togglePromoCodeActive(id, isActive);
  };

  const handleToggleSaleActive = (id: string, isActive: boolean) => {
    toggleSaleActive(id, isActive);
  };

  const handleEditPromoCode = (promoCode: PromoCode) => {
    console.log('Edit promo code:', promoCode);
    // TODO: Navigate to edit page
  };

  const handleEditSale = (sale: Sale) => {
    console.log('Edit sale:', sale);
    // TODO: Navigate to edit page
  };

  const handleDeletePromoCode = (id: string) => {
    deletePromoCode(id);
  };

  const handleDeleteSale = (id: string) => {
    deleteSale(id);
  };

  const handleCopyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // TODO: Show toast notification
    console.log('Copied:', code);
  };

  const hasPromoCodes = promoCodes.length > 0;
  const hasSales = sales.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Marketing</h1>
            <p className="mt-2 text-gray-400">
              Create promo codes and sales to attract and retain customers
            </p>
          </div>

          {/* Action Buttons */}
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

          {/* Tabs */}
          <div className="mb-6 border-b border-white/10">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('promo-codes')}
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
                onClick={() => setActiveTab('sales')}
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

          {/* Tab Content */}
          {activeTab === 'promo-codes' && (
            <>
              {hasPromoCodes ? (
                <PromoCodesTab
                  promoCodes={promoCodes}
                  onToggleActive={handleTogglePromoCodeActive}
                  onEdit={handleEditPromoCode}
                  onDelete={handleDeletePromoCode}
                  onCopyCode={handleCopyPromoCode}
                />
              ) : (
                <MarketingEmptyState type="promo-codes" />
              )}
            </>
          )}

          {activeTab === 'sales' && (
            <>
              {hasSales ? (
                <SalesTab
                  sales={sales}
                  onToggleActive={handleToggleSaleActive}
                  onEdit={handleEditSale}
                  onDelete={handleDeleteSale}
                />
              ) : (
                <MarketingEmptyState type="sales" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
