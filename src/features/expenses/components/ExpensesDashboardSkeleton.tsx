import React from 'react';

export const ExpensesListSkeleton: React.FC = () => {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]"
        />
      ))}
    </div>
  );
};

export const ExpensesDashboardSkeleton: React.FC = () => {
  return (
    <div aria-hidden>
      <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-white/10" />
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl bg-white/10" />
        <div className="h-24 animate-pulse rounded-xl bg-white/10" />
      </div>
      <ExpensesListSkeleton />
    </div>
  );
};
