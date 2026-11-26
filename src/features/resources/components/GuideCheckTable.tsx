import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import React from 'react';

export type GuideCheckColumn = {
  id: string;
  label: string;
  highlight?: boolean;
};

export type GuideCheckRow = {
  feature: string;
  values: Record<string, boolean | string>;
};

type GuideCheckTableProps = {
  caption: string;
  columns: readonly GuideCheckColumn[];
  rows: readonly GuideCheckRow[];
  footnote?: string;
};

export function GuideCheckTable({
  caption,
  columns,
  rows,
  footnote,
}: GuideCheckTableProps) {
  return (
    <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full min-w-[32rem] text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-white/10 bg-white/[0.04]">
          <tr>
            <th className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:px-4">
              Feature
            </th>
            {columns.map(col => (
              <th
                key={col.id}
                className={`px-3 py-3 text-[11px] font-semibold uppercase tracking-wider sm:px-4 ${
                  col.highlight ? 'text-white' : 'text-gray-400'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.feature}
              className={`border-b border-white/10 last:border-0 ${
                index % 2 ? 'bg-white/[0.02]' : ''
              }`}
            >
              <th
                scope="row"
                className="px-3 py-3 text-xs font-medium text-gray-300 sm:px-4 sm:text-sm"
              >
                {row.feature}
              </th>
              {columns.map(col => {
                const value = row.values[col.id];
                return (
                  <td key={col.id} className="px-3 py-3 sm:px-4">
                    {typeof value === 'string' ? (
                      <span className="text-xs text-gray-400 sm:text-sm">
                        {value}
                      </span>
                    ) : value ? (
                      <CheckIcon
                        className="h-5 w-5 text-white"
                        aria-label="Yes"
                      />
                    ) : (
                      <XMarkIcon
                        className="h-5 w-5 text-zinc-600"
                        aria-label="No"
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {footnote ? (
        <p className="border-t border-white/10 px-3 py-2.5 text-[11px] text-gray-500 sm:px-4">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
