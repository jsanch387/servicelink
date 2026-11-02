import React from 'react';

import type { PaymentsTransactionListItem } from '../transactions/publicTransaction';

function detailLine(item: PaymentsTransactionListItem): string {
  return item.subtitle?.trim() ?? '';
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];

export function PaymentsTransactionsTableSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading transactions">
      <div className="hidden overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Description
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Amount
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {SKELETON_ROWS.map(row => (
              <tr key={row} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-4">
                  <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-3 w-28 animate-pulse rounded bg-white/[0.06]" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-4 w-14 animate-pulse rounded bg-white/10" />
                </td>
                <td className="px-5 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex list-none flex-col gap-3 md:hidden">
        {SKELETON_ROWS.slice(0, 4).map(row => (
          <li
            key={row}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PaymentsTransactionsTable({
  items,
}: {
  items: PaymentsTransactionListItem[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02] md:block">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Description
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Amount
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Status
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const detail = detailLine(item);
              const status = item.statusLabel.trim();
              return (
                <tr
                  key={item.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-5 py-4 align-middle">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                      {item.extraCount > 0 ? (
                        <span className="ml-1.5 font-normal text-zinc-500">
                          +{item.extraCount} more
                        </span>
                      ) : null}
                    </p>
                    {detail ? (
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {detail}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <p className="text-sm font-semibold tabular-nums text-white">
                      {item.amountLabel}
                    </p>
                    {item.feeLabel ? (
                      <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
                        {item.feeLabel}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 align-middle text-sm text-zinc-300">
                    {status || '—'}
                  </td>
                  <td className="px-5 py-4 align-middle text-sm whitespace-nowrap text-zinc-400">
                    {item.dateLabel || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex list-none flex-col gap-3 md:hidden">
        {items.map(item => {
          const detail = detailLine(item);
          const status = item.statusLabel.trim();
          return (
            <li
              key={item.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.title}
                    {item.extraCount > 0 ? (
                      <span className="ml-1.5 font-normal text-zinc-500">
                        +{item.extraCount} more
                      </span>
                    ) : null}
                  </p>
                  {detail ? (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {detail}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-white">
                  {item.amountLabel}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                <span className="text-zinc-300">{status || '—'}</span>
                <span className="text-zinc-500">
                  {item.feeLabel ? `${item.feeLabel} · ` : ''}
                  {item.dateLabel || '—'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
