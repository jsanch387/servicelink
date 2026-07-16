'use client';

import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import React, { useState } from 'react';

interface MarketplaceSearchProps {
  onSearch: (location: string, service: string) => void;
}

export const MarketplaceSearch: React.FC<MarketplaceSearchProps> = ({
  onSearch,
}) => {
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location, 'detailing');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="space-y-5">
            {/* Location Input */}
            <div>
              <Input
                label="Your Location"
                placeholder="Enter your address or zip code"
                value={location}
                onChange={setLocation}
                type="text"
                required
                leftIcon={<MapPinIcon className="h-5 w-5" />}
                inputClassName="text-base"
              />
            </div>

            {/* Service Type Display - Fixed for now */}
            <div>
              <label className="block text-left text-sm font-medium text-gray-200 mb-1.5">
                Service Type
              </label>
              <div className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-white text-base sm:text-sm font-medium flex items-center gap-2">
                <span className="text-xl">✨</span>
                <span>Auto Detailing</span>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-8">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              disabled={!location.trim()}
            >
              Search Services
            </Button>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-500">
          Find trusted detailing professionals ready to help
        </p>
      </form>
    </div>
  );
};
