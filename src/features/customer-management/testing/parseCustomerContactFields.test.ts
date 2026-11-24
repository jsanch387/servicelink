import { describe, expect, it } from 'vitest';
import {
  formatCustomerAddress,
  parseCustomerAddressFields,
  parseCustomerEmailField,
  parseCustomerPhoneField,
  parseCustomerProfileFields,
} from '@/features/customer-management/utils/parseCustomerContactFields';

describe('parseCustomerContactFields', () => {
  it('requires a 10-digit phone and a real email', () => {
    expect(parseCustomerPhoneField('(512) 555-0100')).toEqual({
      ok: true,
      phone: '5125550100',
    });
    expect(parseCustomerPhoneField('555').ok).toBe(false);
    expect(parseCustomerEmailField(' Ada@Shop.com ')).toEqual({
      ok: true,
      email: 'ada@shop.com',
    });
    expect(parseCustomerEmailField('not-an-email').ok).toBe(false);
  });

  it('requires street, city, state, and ZIP', () => {
    expect(
      parseCustomerAddressFields({
        street: ' 12 Main ',
        unit: 'Apt 2',
        city: 'Austin',
        state: 'tx',
        zip: '78701',
      })
    ).toEqual({
      ok: true,
      address: {
        street: '12 Main',
        unit: 'Apt 2',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      },
    });
    expect(
      parseCustomerAddressFields({
        street: '',
        unit: '',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      }).ok
    ).toBe(false);
  });

  it('saves a full profile and allows cleared phone, email, and address', () => {
    expect(
      parseCustomerProfileFields({
        name: ' Ada Lovelace ',
        phone: '5125550100',
        email: 'Ada@Shop.com',
        street: '12 Main',
        unit: '',
        city: 'Austin',
        state: 'tx',
        zip: '78701',
        note: 'Gate code 1234',
      })
    ).toEqual({
      ok: true,
      profile: {
        fullName: 'Ada Lovelace',
        phone: '5125550100',
        email: 'ada@shop.com',
        address: {
          street: '12 Main',
          unit: '',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
        },
        note: 'Gate code 1234',
      },
    });

    expect(
      parseCustomerProfileFields({
        name: 'Ada',
        phone: '',
        email: '',
        street: '',
        unit: '',
        city: '',
        state: '',
        zip: '',
        note: '',
      })
    ).toEqual({
      ok: true,
      profile: {
        fullName: 'Ada',
        phone: null,
        email: null,
        address: null,
        note: '',
      },
    });

    expect(
      parseCustomerProfileFields({
        name: ' ',
        phone: '',
        email: '',
        street: '',
        unit: '',
        city: '',
        state: '',
        zip: '',
        note: '',
      }).ok
    ).toBe(false);
  });

  it('formats a saved address on two lines', () => {
    expect(
      formatCustomerAddress({
        street: '12 Main',
        unit: 'Apt 2',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      })
    ).toBe('12 Main, Apt 2\nAustin, TX 78701');
  });
});
