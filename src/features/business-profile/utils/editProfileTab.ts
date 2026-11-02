export type EditProfileTabId = 'photos' | 'details' | 'booking' | 'contact';

const EDIT_PROFILE_TAB_IDS: EditProfileTabId[] = [
  'photos',
  'details',
  'booking',
  'contact',
];

export function parseEditProfileTab(
  value: string | undefined
): EditProfileTabId | undefined {
  if (!value) return undefined;
  return EDIT_PROFILE_TAB_IDS.includes(value as EditProfileTabId)
    ? (value as EditProfileTabId)
    : undefined;
}

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
    message.includes('service location') ||
    message.includes('policy')
  ) {
    return 'booking';
  }

  if (
    message.includes('location') ||
    message.includes('zip') ||
    message.includes('city') ||
    message.includes('service area') ||
    message.includes('travel distance')
  ) {
    return 'details';
  }

  return 'details';
}
