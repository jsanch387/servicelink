import React from 'react';

export const MarketplaceHero: React.FC = () => {
  return (
    <div className="text-center mb-12 animate-hero-float-in">
      <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
        Find Service Pros
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 mt-2">
          Near You
        </span>
      </h1>
      <p className="text-gray-400 text-lg sm:text-xl max-w-xl mx-auto">
        Connect with trusted detailing professionals in your area
      </p>
    </div>
  );
};
