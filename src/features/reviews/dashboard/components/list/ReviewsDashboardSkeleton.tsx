'use client';

import React from 'react';

export const ReviewsDashboardSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4 pb-8">
      <div className="h-36 rounded-2xl bg-white/[0.04]" />
      <div className="h-28 rounded-2xl bg-white/[0.04]" />
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-9 w-20 rounded-full bg-white/[0.04]" />
        ))}
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
};
