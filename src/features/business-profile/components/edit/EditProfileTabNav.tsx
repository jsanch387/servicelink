'use client';

import React from 'react';

export type EditProfileTabId = 'photos' | 'details' | 'booking' | 'contact';

export const EDIT_PROFILE_TABS: {
  id: EditProfileTabId;
  label: string;
}[] = [
  { id: 'photos', label: 'Photos' },
  { id: 'details', label: 'Details' },
  { id: 'booking', label: 'Booking' },
  { id: 'contact', label: 'Contact' },
];

export function tabForSaveErrors(errors: string[]): EditProfileTabId {
  const message = errors.join(' ').toLowerCase();

  if (message.includes('gallery') || message.includes('upload')) {
    return 'photos';
  }

  if (message.includes('phone')) {
    return 'contact';
  }

  if (
    message.includes('shop') ||
    message.includes('service type') ||
    message.includes('service location')
  ) {
    return 'booking';
  }

  if (
    message.includes('location') ||
    message.includes('zip') ||
    message.includes('city') ||
    message.includes('service area')
  ) {
    return 'details';
  }

  return 'details';
}

export interface EditProfileTabNavProps {
  activeTab: EditProfileTabId;
  onTabChange: (id: EditProfileTabId) => void;
}

export function EditProfileTabNav({
  activeTab,
  onTabChange,
}: EditProfileTabNavProps) {
  return (
    <div
      className="flex gap-5 overflow-x-auto border-b border-white/[0.06] scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Profile edit sections"
    >
      {EDIT_PROFILE_TABS.map(tab => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`edit-profile-tabpanel-${tab.id}`}
            id={`edit-profile-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`relative shrink-0 cursor-pointer touch-manipulation pb-3 pt-0.5 text-sm font-medium transition-colors ${
              selected ? 'text-white' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {tab.label}
            {selected ? (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
