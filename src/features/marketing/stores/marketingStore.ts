'use client';

import { create } from 'zustand';
import type { PromoCode, Sale } from '../types';

/**
 * UI-only marketing state for design/preview. Replace with API data later.
 */
interface MarketingState {
  promoCodes: PromoCode[];
  sales: Sale[];
  addPromoCode: (promoCode: PromoCode) => void;
  togglePromoCodeActive: (id: string, isActive: boolean) => void;
  deletePromoCode: (id: string) => void;
  addSale: (sale: Sale) => void;
  toggleSaleActive: (id: string, isActive: boolean) => void;
  deleteSale: (id: string) => void;
}

export const useMarketingStore = create<MarketingState>()(set => ({
  promoCodes: [],
  sales: [],
  addPromoCode: promoCode =>
    set(state => ({ promoCodes: [promoCode, ...state.promoCodes] })),
  togglePromoCodeActive: (id, isActive) =>
    set(state => ({
      promoCodes: state.promoCodes.map(code =>
        code.id === id ? { ...code, isActive } : code
      ),
    })),
  deletePromoCode: id =>
    set(state => ({
      promoCodes: state.promoCodes.filter(code => code.id !== id),
    })),
  addSale: sale => set(state => ({ sales: [sale, ...state.sales] })),
  toggleSaleActive: (id, isActive) =>
    set(state => ({
      sales: state.sales.map(sale =>
        sale.id === id ? { ...sale, isActive } : sale
      ),
    })),
  deleteSale: id =>
    set(state => ({
      sales: state.sales.filter(sale => sale.id !== id),
    })),
}));
