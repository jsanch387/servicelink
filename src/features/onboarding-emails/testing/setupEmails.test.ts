import { describe, expect, it } from 'vitest';

import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';

import {
  buildQrCodeEmail,
  buildReceiptReviewEmail,
  buildSetupEmail,
  buildTestAppointmentEmail,
} from '../templates/setupEmails';

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
    expect(email.html).toContain('Get the app');
    expect(email.html).toContain('cid:welcome-app-store');
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

  it('asks them to book their first appointment', () => {
    const email = buildTestAppointmentEmail(content);
    expect(email.subject).toBe('Your booking page is ready');
    expect(email.html).toContain('Book your first appointment');
    expect(email.text).toContain('texts and emails');
  });

  it('sells the receipt and the review on the last booking note', () => {
    const email = buildReceiptReviewEmail(content);
    expect(email.subject).toBe('One appointment, and the follow-up is handled');
    expect(email.html).toContain('Book your first appointment');
    expect(email.text).toContain('receipt');
    expect(email.text).toContain('review');
  });

  it('points the last note at the app stores and does not attach a QR image', () => {
    const email = buildQrCodeEmail(content);
    expect(email.subject).toBe('Turn your cards into booking machines');
    expect(email.html).toContain(IOS_APP_STORE_URL);
    expect(email.html).toContain(GOOGLE_PLAY_STORE_URL);
    expect(email.text).toContain('cards');
    expect(email.text).toContain('request a quote');
    expect(email.html).toContain('Get the app');
    expect(email.html).not.toContain('qrcode');
  });
});
