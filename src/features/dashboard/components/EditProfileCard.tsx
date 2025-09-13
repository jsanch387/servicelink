'use client';

import React from 'react';
import { PencilIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/constants/routes';
import { Card, Button } from '@/components/shared';

export const EditProfileCard: React.FC = () => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <PencilIcon className="h-5 w-5 text-orange-400" />
          <span>Need to Make Changes?</span>
        </h3>
      </div>

      <p className="text-gray-300 mb-6">
        Update your business information, add new services, upload photos, or
        modify your contact details anytime.
      </p>

      <div className="space-y-4">
        {/* Quick Edit Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-neutral-700 rounded-md p-3">
            <h4 className="text-sm font-medium text-white mb-1">
              Business Info
            </h4>
            <p className="text-xs text-gray-400">Name, type, location, bio</p>
          </div>
          <div className="bg-neutral-700 rounded-md p-3">
            <h4 className="text-sm font-medium text-white mb-1">
              Services & Pricing
            </h4>
            <p className="text-xs text-gray-400">
              Add, edit, or remove services
            </p>
          </div>
          <div className="bg-neutral-700 rounded-md p-3">
            <h4 className="text-sm font-medium text-white mb-1">Portfolio</h4>
            <p className="text-xs text-gray-400">Upload work examples</p>
          </div>
          <div className="bg-neutral-700 rounded-md p-3">
            <h4 className="text-sm font-medium text-white mb-1">
              Contact Info
            </h4>
            <p className="text-xs text-gray-400">Phone, email, social media</p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <Button
          href={ROUTES.DASHBOARD.BUSINESS_PROFILE}
          variant="primary"
          fullWidth
          icon={<PencilIcon />}
          className="group"
        >
          Edit Profile
          <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  );
};
