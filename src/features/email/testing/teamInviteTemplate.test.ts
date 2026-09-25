import {
  buildTeamInviteEmailHtml,
  buildTeamInviteEmailPlainText,
  getTeamInviteEmailSubject,
} from '@/features/email/team-invite/teamInviteTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  businessName: 'Sparkle',
  recipientName: 'Jose',
  inviteUrl: 'https://myservicelink.app/team/invite/token-1',
  expiresInDays: 14,
};

describe('team invite email template', () => {
  it('uses an account notice as the subject', () => {
    expect(getTeamInviteEmailSubject('Sparkle')).toBe(
      'Sparkle added you to their team'
    );
  });

  it('includes the person, shop, expiry, and link', () => {
    const text = buildTeamInviteEmailPlainText(payload);
    const html = buildTeamInviteEmailHtml(payload);

    expect(text).toContain('Hi Jose,');
    expect(text).toContain('Sparkle added you to their team');
    expect(text).toContain('Link expires: 14 days');
    expect(text).toContain(payload.inviteUrl);
    expect(text).not.toMatch(/you're invited|accept invite|get started/i);

    expect(html).toContain('Added to the team');
    expect(html).toContain('Jose');
    expect(html).toContain('14 days');
    expect(html).toContain(payload.inviteUrl);
    expect(html).not.toMatch(/you're invited|accept invite|get started/i);
  });

  it('escapes untrusted HTML in the body', () => {
    const html = buildTeamInviteEmailHtml({
      ...payload,
      recipientName: '<script>alert(1)</script>',
      businessName: 'Shop <b>Name</b>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Shop &lt;b&gt;Name&lt;/b&gt;');
  });
});
