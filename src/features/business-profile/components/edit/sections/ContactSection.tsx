'use client';

import { GlassCard, Input, PhoneInput } from '@/components/shared';
import { InstagramIcon, TikTokIcon } from '@/icons';
import React from 'react';
import { EditingFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import {
  normalizeSocialInput,
  socialProfileUrl,
  type SocialPlatform,
} from '@/features/business-profile/utils/socialMedia';

interface ContactSectionProps {
  formData: EditingFormData;
  onInputChange: (field: string, value: string) => void;
  errors: string[];
}

function customersOpenHint(
  platform: SocialPlatform,
  value: string
): React.ReactNode | undefined {
  const href = socialProfileUrl(platform, value);
  if (href) {
    const display = href.replace(/^https:\/\/(www\.)?/, '');
    return (
      <>
        Customers open <span className="text-zinc-400">{display}</span>
      </>
    );
  }

  if (!value.trim()) return undefined;

  return 'Enter your @username, or paste your profile link.';
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  formData,
  onInputChange,
  errors,
}) => {
  const phoneError = errors.some(e => e.includes('phone number'))
    ? 'Please enter a valid 10-digit phone number'
    : undefined;

  const commitSocialField = (
    platform: SocialPlatform,
    field: 'instagram' | 'tiktok'
  ) => {
    const current = formData[field];
    const normalized = normalizeSocialInput(platform, current);
    if (normalized) {
      onInputChange(field, `@${normalized}`);
      return;
    }
    if (!current.trim()) {
      onInputChange(field, '');
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 text-left">
      <div>
        <p className="text-sm font-medium text-gray-200">Phone</p>
        <p className="mt-1 text-xs text-zinc-500">
          Optional. Shown on your profile so customers can call you.
        </p>

        <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
          <PhoneInput
            label="Number"
            value={formData.phone_number_call}
            onChange={value => onInputChange('phone_number_call', value)}
            placeholder="(555) 123-4567"
            showIcon
            showDigitHint
            error={phoneError}
          />
        </GlassCard>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-200">Socials</p>
        <p className="mt-1 text-xs text-zinc-500">
          Optional. Just add your @username — we’ll link it on your page.
        </p>

        <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
          <div className="space-y-4">
            <Input
              label="Instagram username"
              name="instagram"
              autoComplete="off"
              placeholder="@yourbusiness"
              value={formData.instagram}
              onChange={value => onInputChange('instagram', value)}
              onBlur={() => commitSocialField('instagram', 'instagram')}
              leftIcon={<InstagramIcon className="h-4 w-4" />}
              hint={customersOpenHint('instagram', formData.instagram)}
            />
            <Input
              label="TikTok username"
              name="tiktok"
              autoComplete="off"
              placeholder="@yourbusiness"
              value={formData.tiktok}
              onChange={value => onInputChange('tiktok', value)}
              onBlur={() => commitSocialField('tiktok', 'tiktok')}
              leftIcon={<TikTokIcon className="h-4 w-4" />}
              hint={customersOpenHint('tiktok', formData.tiktok)}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
