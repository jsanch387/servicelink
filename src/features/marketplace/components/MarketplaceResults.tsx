'use client';

import { ArrowLeftIcon, MapPinIcon, StarIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import React from 'react';

interface MarketplaceResultsProps {
  location: string;
  service: string;
  onNewSearch: () => void;
}

// Mock data for UI demonstration
const mockBusinesses = [
  {
    id: '1',
    name: 'Premium Auto Detail Co.',
    slug: 'premium-auto-detail',
    rating: 4.9,
    reviewCount: 127,
    location: 'Downtown Area',
    description: 'Full-service auto detailing with ceramic coating specialists',
    image: null,
  },
  {
    id: '2',
    name: 'Elite Mobile Detailing',
    slug: 'elite-mobile-detailing',
    rating: 4.8,
    reviewCount: 89,
    location: 'Midtown',
    description: 'Professional mobile detailing - we come to you',
    image: null,
  },
  {
    id: '3',
    name: 'Shine Masters Detailing',
    slug: 'shine-masters',
    rating: 4.7,
    reviewCount: 156,
    location: 'West Side',
    description: 'Expert interior and exterior detailing services',
    image: null,
  },
];

export const MarketplaceResults: React.FC<MarketplaceResultsProps> = ({
  location,
  onNewSearch,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-hero-float-in">
      {/* Header with back button */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewSearch}
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          className="mb-6"
        >
          New Search
        </Button>

        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Available Services
          </h2>
          <p className="text-gray-400 text-base sm:text-lg flex items-center justify-center gap-2">
            <MapPinIcon className="h-5 w-5 text-gray-500" />
            Near {location}
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {mockBusinesses.map(business => (
          <Card
            key={business.id}
            className="overflow-hidden hover:border-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-white/5 cursor-pointer group"
            padding="md"
          >
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Logo/Image Placeholder */}
              <div className="flex-shrink-0">
                <div className="w-full sm:w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-lg flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                  <span className="text-4xl">✨</span>
                </div>
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
                  {business.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-medium">
                      {business.rating}
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm">
                    ({business.reviewCount} reviews)
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {business.description}
                </p>

                {/* Location Badge */}
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{business.location}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center sm:items-start">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // In the future, this will navigate to the booking page
                    window.open(
                      `${window.location.origin}/${business.slug}`,
                      '_blank'
                    );
                  }}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  View Profile
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More (placeholder for future pagination) */}
      <div className="mt-8 text-center">
        <Button variant="outline" size="md" disabled>
          Load More Results
        </Button>
        <p className="text-gray-500 text-sm mt-3">
          Showing {mockBusinesses.length} businesses
        </p>
      </div>
    </div>
  );
};
