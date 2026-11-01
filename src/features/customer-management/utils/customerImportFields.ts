export const CUSTOMER_IMPORT_MAX_ROWS = 2000;

export const CUSTOMER_IMPORT_TEMPLATE_HEADERS = [
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

export const CUSTOMER_IMPORT_PROMPT = `Convert the attached customer export into a CSV I can import. Return only the CSV, with this header row and no other text:

full_name,phone,email,street,unit,city,state,zip,notes,vehicle

Rules:
- One row per customer.
- Combine first and last name into full_name.
- Leave a cell blank when the export does not have that information. Do not guess or invent values.
- Phone numbers must be United States numbers, written as 10 digits. A leading 1 or +1 is okay to drop. If a number is not a US number, leave phone blank.
- State is the 2-letter code. ZIP is 5 digits.
- Notes must be 280 characters or fewer. Keep the useful part.
- Put extra vehicles in the vehicle cell, separated by semicolons, like 2020 Honda Civic; 2018 Ford F-150.
- Leave out appointments, invoices, payments, and any column that is not in the header.`;

export function customerImportTemplateCsv(): string {
  return `${CUSTOMER_IMPORT_TEMPLATE_HEADERS.join(',')}\n`;
}

export const CUSTOMER_IMPORT_FIELDS = [
  { id: 'ignore', label: 'Ignore' },
  { id: 'full_name', label: 'Name' },
  { id: 'first_name', label: 'First name' },
  { id: 'last_name', label: 'Last name' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
  { id: 'street', label: 'Street' },
  { id: 'unit', label: 'Unit' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State' },
  { id: 'zip', label: 'ZIP' },
  { id: 'address', label: 'Full address' },
  { id: 'notes', label: 'Notes' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'vehicle_year', label: 'Vehicle year' },
  { id: 'vehicle_make', label: 'Vehicle make' },
  { id: 'vehicle_model', label: 'Vehicle model' },
] as const;

export type CustomerImportFieldId =
  (typeof CUSTOMER_IMPORT_FIELDS)[number]['id'];

const CANONICAL_HEADERS = new Set([
  'full name',
  'phone',
  'email',
  'street',
  'unit',
  'city',
  'state',
  'zip',
  'notes',
  'vehicle',
]);

const FIELD_SYNONYMS: Record<
  Exclude<CustomerImportFieldId, 'ignore'>,
  readonly string[]
> = {
  full_name: [
    'full name',
    'fullname',
    'name',
    'customer name',
    'client name',
    'customer',
    'client',
  ],
  first_name: ['first name', 'firstname', 'given name', 'first'],
  last_name: ['last name', 'lastname', 'surname', 'family name', 'last'],
  phone: [
    'phone',
    'phone number',
    'mobile',
    'mobile phone',
    'cell',
    'cell phone',
    'telephone',
    'tel',
  ],
  email: ['email', 'e mail', 'email address'],
  street: ['street', 'street address', 'address 1', 'address line 1', 'line 1'],
  unit: ['unit', 'apt', 'apartment', 'suite', 'address 2', 'address line 2'],
  city: ['city', 'town'],
  state: ['state'],
  zip: ['zip', 'zip code', 'zipcode', 'postal', 'postal code', 'postcode'],
  address: ['full address', 'address'],
  notes: ['notes', 'note', 'comments', 'comment'],
  vehicle: ['vehicle', 'car', 'vehicles'],
  vehicle_year: ['year', 'vehicle year', 'car year'],
  vehicle_make: ['make', 'vehicle make', 'car make'],
  vehicle_model: ['model', 'vehicle model', 'car model'],
};

const MATCH_ORDER: Exclude<CustomerImportFieldId, 'ignore'>[] = [
  'first_name',
  'last_name',
  'phone',
  'email',
  'street',
  'unit',
  'city',
  'state',
  'zip',
  'notes',
  'vehicle_year',
  'vehicle_make',
  'vehicle_model',
  'vehicle',
  'address',
  'full_name',
];

export function normalizeImportHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldForHeader(
  header: string,
  hasSplitAddress: boolean
): CustomerImportFieldId {
  const key = normalizeImportHeader(header);
  if (!key) return 'ignore';
  for (const field of MATCH_ORDER) {
    if (FIELD_SYNONYMS[field].includes(key)) {
      if (field === 'address' && hasSplitAddress) return 'street';
      return field;
    }
  }
  return 'ignore';
}

export function suggestCustomerImportMapping(
  headers: string[],
  includeVehicles: boolean
): CustomerImportFieldId[] {
  const normalized = headers.map(normalizeImportHeader);
  const hasSplitAddress = normalized.some(header =>
    ['city', 'town', 'state', 'zip', 'zip code', 'postal code'].includes(header)
  );
  const used = new Set<CustomerImportFieldId>();
  return headers.map(header => {
    let field = fieldForHeader(header, hasSplitAddress);
    if (!includeVehicles && field.startsWith('vehicle')) field = 'ignore';
    if (field !== 'ignore' && used.has(field)) return 'ignore';
    if (field !== 'ignore') used.add(field);
    return field;
  });
}

export function isCanonicalCustomerImport(headers: string[]): boolean {
  const keys = headers.map(normalizeImportHeader).filter(Boolean);
  if (!keys.includes('full name')) return false;
  if (new Set(keys).size !== keys.length) return false;
  return keys.every(key => CANONICAL_HEADERS.has(key));
}

export function customerImportMappingError(
  mapping: readonly CustomerImportFieldId[]
): string | null {
  const counts = new Map<CustomerImportFieldId, number>();
  for (const field of mapping) {
    if (field === 'ignore') continue;
    counts.set(field, (counts.get(field) ?? 0) + 1);
  }
  for (const [field, count] of counts) {
    if (count > 1) {
      const label =
        CUSTOMER_IMPORT_FIELDS.find(option => option.id === field)?.label ??
        'That field';
      return `${label} is selected more than once.`;
    }
  }
  const hasName = counts.has('full_name');
  const hasFirst = counts.has('first_name');
  const hasLast = counts.has('last_name');
  if (!hasName && !(hasFirst && hasLast)) {
    return 'Map a Name column, or both First name and Last name.';
  }
  if (hasName && (hasFirst || hasLast)) {
    return 'Use Name, or First name and Last name, not both.';
  }
  return null;
}

export function customerImportFieldOptions(
  includeVehicles: boolean
): { value: CustomerImportFieldId; label: string }[] {
  return CUSTOMER_IMPORT_FIELDS.filter(
    field => includeVehicles || !field.id.startsWith('vehicle')
  ).map(field => ({ value: field.id, label: field.label }));
}
