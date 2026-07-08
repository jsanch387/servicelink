'use client';

import { Button } from '@/components/shared';
import { MegaphoneIcon, TicketIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { CreatePromoCodeModal } from './CreatePromoCodeModal';
import { CreateSaleModal } from './CreateSaleModal';
import { MarketingEmptyState } from './MarketingEmptyState';
import { PromoCodesTab } from './PromoCodesTab';
import { SalesTab } from './SalesTab';
import type {
  PromoCode,
  PromoCodeFormData,
  Sale,
  SaleFormData,
} from '../types';

type TabType = 'promo-codes' | 'sales';

export const MarketingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('promo-codes');
  const [isPromoCodeModalOpen, setIsPromoCodeModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);

  // Mock data - replace with real data later
  const [promoCodes] = useState<PromoCode[]>([]);
  const [sales] = useState<Sale[]>([]);

  const handleCreatePromoCode = (data: PromoCodeFormData) => {
    console.log('Create promo code:', data);
    // TODO: API call to create promo code
    setIsPromoCodeModalOpen(false);
  };

  const handleCreateSale = (data: SaleFormData) => {
    console.log('Create sale:', data);
    // TODO: API call to create sale
    setIsSaleModalOpen(false);
  };

  const handleTogglePromoCodeActive = (id: string, isActive: boolean) => {
    console.log('Toggle promo code active:', id, isActive);
    // TODO: API call to toggle promo code
  };

  const handleToggleSaleActive = (id: string, isActive: boolean) => {
    console.log('Toggle sale active:', id, isActive);
    // TODO: API call to toggle sale
  };

  const handleEditPromoCode = (promoCode: PromoCode) => {
    console.log('Edit promo code:', promoCode);
    // TODO: Open edit modal with promo code data
  };

  const handleEditSale = (sale: Sale) => {
    console.log('Edit sale:', sale);
    // TODO: Open edit modal with sale data
  };

  const handleDeletePromoCode = (id: string) => {
    console.log('Delete promo code:', id);
    // TODO: Confirm and delete promo code
  };

  const handleDeleteSale = (id: string) => {
    console.log('Delete sale:', id);
    // TODO: Confirm and delete sale
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
              onClick={() => setIsPromoCodeModalOpen(true)}
              variant="primary"
              size="md"
              icon={<TicketIcon className="h-5 w-5" />}
              fullWidth
              className="sm:w-auto"
            >
              New Promo Code
            </Button>
            <Button
              onClick={() => setIsSaleModalOpen(true)}
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
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'promo-codes'
                    ? 'border-orange-500 text-orange-500'
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
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'sales'
                    ? 'border-orange-500 text-orange-500'
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
                <MarketingEmptyState
                  type="promo-codes"
                  onCreateClick={() => setIsPromoCodeModalOpen(true)}
                />
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
                <MarketingEmptyState
                  type="sales"
                  onCreateClick={() => setIsSaleModalOpen(true)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreatePromoCodeModal
        isOpen={isPromoCodeModalOpen}
        onClose={() => setIsPromoCodeModalOpen(false)}
        onSave={handleCreatePromoCode}
      />
      <CreateSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSave={handleCreateSale}
      />
    </div>
  );
};
