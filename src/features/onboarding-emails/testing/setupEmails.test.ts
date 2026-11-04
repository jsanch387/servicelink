import { describe, expect, it } from 'vitest';

import { buildSetupEmail } from '../templates/setupEmails';

const content = {
  dashboardUrl:
    'https://myservicelink.app/dashboard?utm_campaign=A1_setup_one_step',
  privacyUrl: 'https://myservicelink.app/privacy',
  year: 2026,
};

describe('setup emails', () => {
  it('points the first email at the dashboard', () => {
    const email = buildSetupEmail('A1_setup_one_step', content);
    expect(email.subject).toBe('Your booking page is one step away');
    expect(email.html).toContain(content.dashboardUrl);
    expect(email.html).toContain('Hey there,');
    expect(email.html).toContain('Finish my booking page');
    expect(email.text).toContain('Mark');
    expect(email.html).not.toContain('Unsubscribe');
  });

  it('keeps the last nudge about naming the business', () => {
    const email = buildSetupEmail('A2_setup_final', {
      ...content,
      dashboardUrl:
        'https://myservicelink.app/dashboard?utm_campaign=A2_setup_final',
    });
    expect(email.subject).toBe('Still want your booking link?');
    expect(email.text).toContain('Name your business');
    expect(email.text).not.toContain('Pick your services');
  });
});
