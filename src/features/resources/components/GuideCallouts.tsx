import React from 'react';

type GuideKeyTakeawaysProps = {
  items: readonly string[];
};

export function GuideKeyTakeaways({ items }: GuideKeyTakeawaysProps) {
  if (!items.length) return null;

  return (
    <aside
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 mb-10"
      aria-labelledby="key-takeaways-heading"
    >
      <h2
        id="key-takeaways-heading"
        className="text-lg sm:text-xl font-bold text-white mb-3 tracking-tight"
      >
        Key takeaways
      </h2>
      <ul className="space-y-3">
        {items.map(item => (
          <li
            key={item}
            className="flex gap-3 text-sm sm:text-base text-gray-300 leading-relaxed"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

type GuideProTipProps = {
  children: React.ReactNode;
};

export function GuideProTip({ children }: GuideProTipProps) {
  return (
    <aside className="my-8 rounded-xl border border-white/10 border-l-[3px] border-l-white/40 bg-white/[0.03] px-4 py-4 sm:px-5 sm:py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-1.5">
        Pro tip
      </p>
      <div className="text-sm sm:text-base text-gray-300 leading-relaxed [&_a]:text-gray-200 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-white">
        {children}
      </div>
    </aside>
  );
}
