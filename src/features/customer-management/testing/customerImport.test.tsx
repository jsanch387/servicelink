import { ImportCustomersModal } from '@/features/customer-management/components/ImportCustomersModal';
import {
  buildCustomerImportPreview,
  sanitizeCustomerImportRecord,
  selectCustomersToImport,
} from '@/features/customer-management/utils/buildCustomerImportPreview';
import {
  CUSTOMER_IMPORT_PROMPT,
  customerImportMappingError,
  isCanonicalCustomerImport,
  suggestCustomerImportMapping,
} from '@/features/customer-management/utils/customerImportFields';
import { parseCustomerImportCsv } from '@/features/customer-management/utils/parseCustomerImportCsv';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  window.scrollTo = vi.fn();
});

afterEach(() => cleanup());

const CANONICAL = [
  'full_name',
  'phone',
  'email',
  'street',
  'unit',
  'city',
  'state',
  'zip',
  'notes',
  'vehicle',
] as const;

describe('customer import', () => {
  it('tells the chat to keep United States numbers and our header', () => {
    expect(CUSTOMER_IMPORT_PROMPT).toContain(
      'full_name,phone,email,street,unit,city,state,zip,notes,vehicle'
    );
    expect(CUSTOMER_IMPORT_PROMPT).toContain('United States');
  });

  it('reads a chat reply wrapped in a code fence', () => {
    const parsed = parseCustomerImportCsv(`Here you go:
\`\`\`csv
full_name,phone
Ada Lovelace,5125550100
\`\`\``);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.table.rows).toEqual([['Ada Lovelace', '5125550100']]);
  });

  it('suggests columns from another CRM and accepts our own file', () => {
    expect(
      suggestCustomerImportMapping(
        ['First Name', 'Last Name', 'Mobile', 'E-mail'],
        true
      )
    ).toEqual(['first_name', 'last_name', 'phone', 'email']);
    expect(
      customerImportMappingError(['first_name', 'last_name', 'phone', 'email'])
    ).toBeNull();
    expect(isCanonicalCustomerImport([...CANONICAL])).toBe(true);
    expect(isCanonicalCustomerImport(['Customer', 'Phone'])).toBe(false);
  });

  it('keeps a US phone, drops other numbers, and groups vehicles', () => {
    const table = parseCustomerImportCsv(
      [
        CANONICAL.join(','),
        'Ada Lovelace,+1 (512) 555-0100,ada@shop.com,1 Main St,,Austin,Texas,78701-1234,Gate code,2020 Honda Civic',
        'Ada Lovelace,5125550100,ada@shop.com,,,,,,,2018 Ford F-150',
        'Grace Hopper,447911123456,grace@navy.test,,,,,,,',
        ',5125550199,,,,,,,,',
      ].join('\n')
    );
    expect(table.ok).toBe(true);
    if (!table.ok) return;

    const preview = buildCustomerImportPreview(
      table.table,
      suggestCustomerImportMapping(table.table.headers, true),
      { existing: [], includeVehicles: true }
    );

    const ada = preview.ready.find(
      customer => customer.fullName === 'Ada Lovelace'
    );
    expect(ada?.phone).toBe('5125550100');
    expect(ada?.address).toMatchObject({
      street: '1 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    });
    expect(ada?.vehicles).toEqual([
      { year: '2020', make: 'Honda', model: 'Civic' },
      { year: '2018', make: 'Ford', model: 'F-150' },
    ]);

    const grace = preview.ready.find(
      customer => customer.fullName === 'Grace Hopper'
    );
    expect(grace?.phone).toBeNull();
    expect(grace?.warnings).toContain(
      "Phone isn't a US number, so it was left blank."
    );
    expect(preview.skipped.map(row => row.reason)).toContain(
      'Name is required.'
    );
  });

  it('skips someone who is already on the list', () => {
    const { create, skipped } = selectCustomersToImport(
      [
        {
          fullName: 'Ada Lovelace',
          phone: '5125550100',
          email: 'ada@shop.com',
          address: null,
          notes: null,
          vehicles: [],
          warnings: [],
        },
      ],
      [{ phone: '5125550100', email: '' }]
    );
    expect(create).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it('does not store a non-US phone sent to the server', () => {
    const parsed = sanitizeCustomerImportRecord({
      fullName: 'Grace Hopper',
      phone: '+44 7911 123456',
      email: 'not-an-email',
      notes: 'x'.repeat(300),
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.record.phone).toBeNull();
    expect(parsed.record.email).toBeNull();
    expect(parsed.record.notes).toHaveLength(280);
  });
});

describe('ImportCustomersModal', () => {
  it('opens a ready preview for a file that already matches', async () => {
    const user = userEvent.setup();
    render(
      <ImportCustomersModal
        isOpen
        onClose={() => undefined}
        includeVehicles
        existingCustomers={[]}
        onImported={() => undefined}
      />
    );

    const file = new File(
      [
        [
          CANONICAL.join(','),
          'Ada Lovelace,5125550100,ada@shop.com,1 Main St,,Austin,TX,78701,Gate,2020 Honda Civic',
        ].join('\n'),
      ],
      'customers.csv',
      { type: 'text/csv' }
    );
    await user.upload(
      await screen.findByLabelText('Upload a customer file'),
      file
    );

    expect(
      await screen.findByText('1 customer is ready to import.')
    ).toBeTruthy();
    expect(screen.queryByText('Ada Lovelace')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Import 1 customer' })
    ).toBeTruthy();
    expect(screen.queryByText('Import as')).toBeNull();
  });
});
