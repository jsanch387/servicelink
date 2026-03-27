import { buildSmsHref } from '@/features/customer-management/utils/smsLink';
import { describe, expect, it } from 'vitest';

describe('[Core] SMS deep link helper', () => {
  it('uses iOS body separator (?&body=)', () => {
    const href = buildSmsHref(
      '+1 (555) 111-2222',
      'Hey Maria, book here: myservicelink.app/businessname',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    );
    expect(href).toContain('sms:+15551112222?&body=');
  });

  it('uses Android/default body separator (?body=)', () => {
    const href = buildSmsHref(
      '+1 (555) 111-2222',
      'Hey Maria, book here: myservicelink.app/businessname',
      'Mozilla/5.0 (Linux; Android 14)'
    );
    expect(href).toContain('sms:+15551112222?body=');
  });

  it('returns null when phone is missing/invalid', () => {
    expect(buildSmsHref('', 'hello')).toBeNull();
    expect(buildSmsHref('   ', 'hello')).toBeNull();
  });
});
