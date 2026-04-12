import React from 'react';

export const CustomerPageHeader: React.FC = () => {
  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Customers
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your customers and booking activity.
      </p>
    </div>
  );
};
