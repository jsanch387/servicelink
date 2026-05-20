import { CheckIcon, MinusIcon } from '@heroicons/react/20/solid';
import React from 'react';
import {
  PRICING_COMPARISON_ROWS,
  type PricingComparisonCell,
} from '../pricingComparisonRows';
import { PLANS } from '../types';

function ComparisonCellContent({ cell }: { cell: PricingComparisonCell }) {
  if (cell.kind === 'included') {
    return (
      <span className="inline-flex items-center justify-center">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
          <CheckIcon className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        </span>
        <span className="sr-only">Included</span>
      </span>
    );
  }

  if (cell.kind === 'excluded') {
    return (
      <span className="inline-flex items-center justify-center text-zinc-600">
        <MinusIcon className="h-4 w-4" aria-hidden />
        <span className="sr-only">Not included</span>
      </span>
    );
  }

  return (
    <span className="text-sm font-medium text-zinc-200 sm:text-[0.9375rem]">
      {cell.value}
    </span>
  );
}

export interface PricingComparisonTableProps {
  className?: string;
}

/**
 * Free vs Pro feature matrix for public `/pricing`.
 * Mobile-style comparison table with plan prices in the header.
 */
export const PricingComparisonTable: React.FC<PricingComparisonTableProps> = ({
  className = '',
}) => {
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/40 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_50px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:rounded-[1.35rem] ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.03] sm:rounded-[1.35rem]"
        aria-hidden
      />

      <div className="relative z-[1] overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th
                scope="col"
                className="w-[40%] py-5 pl-5 pr-3 text-left text-sm font-medium text-zinc-500 sm:pl-6 sm:text-[0.9375rem]"
              >
                Feature
              </th>
              <th
                scope="col"
                className="w-[30%] px-3 py-5 text-center align-bottom"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="logo-text text-lg font-semibold text-white sm:text-xl">
                    {free.name}
                  </span>
                  <span className="logo-text text-2xl font-semibold tabular-nums text-white sm:text-[1.65rem]">
                    {free.price}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    forever
                  </span>
                </div>
              </th>
              <th
                scope="col"
                className="w-[30%] bg-white/[0.03] px-3 py-5 text-center align-bottom sm:pr-6"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-900">
                    Popular
                  </span>
                  <span className="logo-text text-lg font-semibold text-white sm:text-xl">
                    {pro.name}
                  </span>
                  <span className="logo-text text-2xl font-semibold tabular-nums text-white sm:text-[1.65rem]">
                    {pro.price}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    / month
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {PRICING_COMPARISON_ROWS.map((row, index) => (
              <tr
                key={row.feature}
                className={
                  index < PRICING_COMPARISON_ROWS.length - 1
                    ? 'border-b border-white/[0.05]'
                    : ''
                }
              >
                <th
                  scope="row"
                  className="py-4 pl-5 pr-3 text-sm font-medium text-zinc-300 sm:pl-6 sm:text-[0.9375rem]"
                >
                  {row.feature}
                </th>
                <td className="px-3 py-4 text-center">
                  <ComparisonCellContent cell={row.free} />
                </td>
                <td className="bg-white/[0.02] px-3 py-4 text-center sm:pr-6">
                  <ComparisonCellContent cell={row.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
