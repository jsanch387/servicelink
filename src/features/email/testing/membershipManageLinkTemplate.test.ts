import {
  buildMembershipManageLinkHtml,
  buildMembershipManageLinkPlainText,
  getMembershipManageLinkSubject,
} from '@/features/email/membership-manage-link/membershipManageLinkTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Tessa',
  planName: 'Super Maintenance',
  manageUrl: 'https://example.com/api/public/memberships/portal?token=abc',
};

describe('getMembershipManageLinkSubject', () => {
  it('names the business, not ServiceLink', () => {
    expect(getMembershipManageLinkSubject('Urban Detailing')).toBe(
      'Manage your subscription — Urban Detailing'
    );
  });
});

describe('buildMembershipManageLinkHtml', () => {
  it('uses shared layout with no ServiceLink header mark', () => {
    const html = buildMembershipManageLinkHtml(payload);
    expect(html).toContain('Manage your plan');
    expect(html).toContain(
      'Hi Tessa, use the button below to manage or cancel Super Maintenance with Urban Detailing.'
    );
    expect(html).toContain('Manage or cancel');
    expect(html).toContain(payload.manageUrl);
    expect(html).toContain('Sent for Urban Detailing via ServiceLink');
    expect(html).not.toContain('>ServiceLink</span>');
    expect(html).not.toContain('letter-spacing:1.4px');
  });
});

describe('buildMembershipManageLinkPlainText', () => {
  it('keeps a subtle ServiceLink footer', () => {
    const text = buildMembershipManageLinkPlainText(payload);
    expect(text).toContain('Hi Tessa, use the button below');
    expect(text).toContain(payload.manageUrl);
    expect(text).toContain('Sent for Urban Detailing via ServiceLink');
    expect(text).not.toContain('— ServiceLink');
  });
});
