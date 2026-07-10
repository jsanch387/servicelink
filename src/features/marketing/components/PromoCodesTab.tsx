'use client';

import { Button, Switch } from '@/components/shared';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { PromoCode, PromoCodeStatus } from '../types';
import { PromoCodeCopyButton } from './PromoCodeCopyButton';
import { StatusBadge } from './StatusBadge';

interface PromoCodesTabProps {
  promoCodes: PromoCode[];
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (promoCode: PromoCode) => void;
  onDelete: (promoCode: PromoCode) => void;
  togglingId?: string | null;
}

function getPromoCodeStatus(promoCode: PromoCode): PromoCodeStatus {
  if (!promoCode.isActive) return 'inactive';

  const now = new Date();

  if (promoCode.startsAt && new Date(promoCode.startsAt) > now) {
    return 'scheduled';
  }

  if (promoCode.endsAt && new Date(promoCode.endsAt) < now) {
    return 'expired';
  }

  if (promoCode.maxUses && promoCode.currentUseCount >= promoCode.maxUses) {
    return 'expired';
  }

  return 'active';
}

function formatDiscount(type: string, value: number): string {
  return type === 'percentage' ? `${value}% off` : `$${value} off`;
}

function formatDateRange(startsAt?: Date | null, endsAt?: Date | null): string {
  if (!startsAt && !endsAt) return 'Always active';

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (startsAt && endsAt) {
    return `${formatDate(startsAt)} - ${formatDate(endsAt)}`;
  }
  if (startsAt) {
    return `From ${formatDate(startsAt)}`;
  }
  if (endsAt) {
    return `Until ${formatDate(endsAt)}`;
  }
  return 'Always active';
}

export const PromoCodesTab: React.FC<PromoCodesTabProps> = ({
  promoCodes,
  onToggleActive,
  onEdit,
  onDelete,
  togglingId = null,
}) => {
  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Discount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Uses
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Valid Dates
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Active
              </th>
              <th className="w-10 px-3 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {promoCodes.map(promoCode => {
              const status = getPromoCodeStatus(promoCode);
              const isToggling = togglingId === promoCode.id;

              return (
                <tr
                  key={promoCode.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white">
                        {promoCode.code}
                      </span>
                      <PromoCodeCopyButton code={promoCode.code} />
                    </div>
                    {promoCode.description && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {promoCode.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm font-medium text-gray-200">
                      {formatDiscount(
                        promoCode.discountType,
                        promoCode.discountValue
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm text-gray-200">
                      {promoCode.currentUseCount}
                      {promoCode.maxUses ? ` / ${promoCode.maxUses}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm text-gray-200">
                      {formatDateRange(promoCode.startsAt, promoCode.endsAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Switch
                      checked={promoCode.isActive}
                      onCheckedChange={checked =>
                        onToggleActive(promoCode.id, checked)
                      }
                      size="sm"
                      disabled={isToggling}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(promoCode)}
                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(promoCode)}
                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {promoCodes.map(promoCode => {
          const status = getPromoCodeStatus(promoCode);
          const isToggling = togglingId === promoCode.id;

          return (
            <div
              key={promoCode.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-base font-semibold text-white">
                      {promoCode.code}
                    </span>
                    <PromoCodeCopyButton code={promoCode.code} />
                  </div>
                  {promoCode.description && (
                    <p className="text-sm text-gray-400">
                      {promoCode.description}
                    </p>
                  )}
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="mb-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount:</span>
                  <span className="font-medium text-white">
                    {formatDiscount(
                      promoCode.discountType,
                      promoCode.discountValue
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uses:</span>
                  <span className="text-gray-200">
                    {promoCode.currentUseCount}
                    {promoCode.maxUses ? ` / ${promoCode.maxUses}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Valid:</span>
                  <span className="text-gray-200">
                    {formatDateRange(promoCode.startsAt, promoCode.endsAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onEdit(promoCode)}
                    variant="ghost"
                    size="xs"
                    icon={<PencilSquareIcon className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onDelete(promoCode)}
                    variant="ghost"
                    size="xs"
                    icon={<TrashIcon className="h-4 w-4" />}
                  >
                    Delete
                  </Button>
                </div>
                <Switch
                  checked={promoCode.isActive}
                  onCheckedChange={checked =>
                    onToggleActive(promoCode.id, checked)
                  }
                  size="sm"
                  disabled={isToggling}
                  aria-label="Toggle active"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
