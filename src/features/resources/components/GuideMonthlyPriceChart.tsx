import React from 'react';
import { PRICES_AS_OF } from '../data/competitorPrices';

export type PriceBar = {
  name: string;
  monthlyUsd: number;
  highlight?: boolean;
};

type GuideMonthlyPriceChartProps = {
  bars: readonly PriceBar[];
  caption?: string;
};

export function GuideMonthlyPriceChart({
  bars,
  caption = `Monthly list price as of ${PRICES_AS_OF}`,
}: GuideMonthlyPriceChartProps) {
  const max = Math.max(...bars.map(bar => bar.monthlyUsd), 1);

  return (
    <figure className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <figcaption className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {caption}
      </figcaption>
      <ul className="space-y-3">
        {bars.map(bar => {
          const width = Math.max(8, (bar.monthlyUsd / max) * 100);
          return (
            <li key={bar.name}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span
                  className={
                    bar.highlight ? 'font-semibold text-white' : 'text-gray-300'
                  }
                >
                  {bar.name}
                </span>
                <span className="tabular-nums text-gray-400">
                  ${bar.monthlyUsd}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06]">
                <div
                  className={`h-2 rounded-full ${
                    bar.highlight ? 'bg-white' : 'bg-white/35'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
