'use client';

import { Button, Switch } from '@/components/shared';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { Sale } from '../types';
import { formatSaleDateRange } from '../utils/formatSaleDateRange';
import { getSaleStatus } from '../utils/getSaleStatus';
import { StatusBadge } from './StatusBadge';
import { TruncatedSaleName } from './TruncatedSaleName';

interface SalesTabProps {
  sales: Sale[];
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
  togglingId?: string | null;
}

function formatDiscount(type: string, value: number): string {
  return type === 'percentage' ? `${value}% off` : `$${value} off`;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  sales,
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
                Sale Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Discount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Valid Dates
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Applies To
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Active
              </th>
              <th className="w-10 px-3 py-3" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {sales.map(sale => {
              const status = getSaleStatus(sale);
              const isToggling = togglingId === sale.id;

              return (
                <tr
                  key={sale.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="max-w-[14rem] px-4 py-3 align-middle lg:max-w-xs">
                    <div className="min-w-0">
                      <TruncatedSaleName
                        name={sale.name}
                        className="text-sm font-semibold text-white"
                      />
                      {sale.description && (
                        <p
                          className="mt-0.5 truncate text-xs text-gray-400"
                          title={sale.description}
                        >
                          {sale.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm font-medium text-gray-200">
                      {formatDiscount(sale.discountType, sale.discountValue)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={status} />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm text-gray-200">
                      {formatSaleDateRange(sale.startsAt, sale.endsAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className="text-sm text-gray-200">
                      {sale.appliesToAllServices
                        ? 'All services'
                        : 'Selected services'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Switch
                      checked={sale.isActive}
                      onCheckedChange={checked =>
                        onToggleActive(sale.id, checked)
                      }
                      size="sm"
                      disabled={isToggling}
                    />
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(sale)}
                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(sale)}
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
        {sales.map(sale => {
          const status = getSaleStatus(sale);
          const isToggling = togglingId === sale.id;

          return (
            <div
              key={sale.id}
              className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <TruncatedSaleName
                    name={sale.name}
                    as="h4"
                    className="mb-1 text-base font-semibold text-white"
                  />
                  {sale.description && (
                    <p className="text-sm text-gray-400">{sale.description}</p>
                  )}
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="mb-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Discount:</span>
                  <span className="font-medium text-white">
                    {formatDiscount(sale.discountType, sale.discountValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Valid:</span>
                  <span className="text-gray-200">
                    {formatSaleDateRange(sale.startsAt, sale.endsAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Applies to:</span>
                  <span className="text-gray-200">
                    {sale.appliesToAllServices
                      ? 'All services'
                      : 'Selected services'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onEdit(sale)}
                    variant="ghost"
                    size="xs"
                    icon={<PencilSquareIcon className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => onDelete(sale)}
                    variant="ghost"
                    size="xs"
                    icon={<TrashIcon className="h-4 w-4" />}
                  >
                    Delete
                  </Button>
                </div>
                <Switch
                  checked={sale.isActive}
                  onCheckedChange={checked => onToggleActive(sale.id, checked)}
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
