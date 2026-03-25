import React from 'react';

export const CustomerPageHeader: React.FC = () => {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Customers
      </h1>
      <p className="text-gray-400 text-sm sm:text-base mt-1">
        Manage your customers and booking activity.
      </p>
    </div>
  );
};
