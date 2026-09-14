export const SETTINGS_TABS = ['account', 'team'] as const;
export type SettingsTabId = (typeof SETTINGS_TABS)[number];

export const SETTINGS_TAB_OPTIONS: readonly {
  id: SettingsTabId;
  label: string;
}[] = [
  { id: 'account', label: 'Account' },
  { id: 'team', label: 'Team members' },
];

export function parseSettingsTab(
  value: string | null | undefined
): SettingsTabId {
  return value === 'team' ? 'team' : 'account';
}
