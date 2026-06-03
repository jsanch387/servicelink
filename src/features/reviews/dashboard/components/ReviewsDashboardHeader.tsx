import React from 'react';

export const ReviewsDashboardHeader: React.FC = () => {
  return (
    <header className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Reviews
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        See what customers are saying about their visits and reply from this
        page.
      </p>
    </header>
  );
};
