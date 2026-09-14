import { describe, expect, it } from 'vitest';

import { parseSettingsTab } from '../constants/settingsTabs';

describe('parseSettingsTab', () => {
  it('reads team and defaults to account', () => {
    expect(parseSettingsTab('team')).toBe('team');
    expect(parseSettingsTab('account')).toBe('account');
    expect(parseSettingsTab(null)).toBe('account');
    expect(parseSettingsTab('nope')).toBe('account');
  });
});
