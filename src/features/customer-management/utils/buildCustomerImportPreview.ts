import { isValidEmail } from '@/features/auth/utils/validation';
import { normalizeEmailForLookup } from '@/features/customer-management/server/normalizeCustomerContact';
import type { CustomerAddress } from '@/features/customer-management/types';
import type { CustomerImportFieldId } from '@/features/customer-management/utils/customerImportFields';
import type { CustomerImportTable } from '@/features/customer-management/utils/parseCustomerImportCsv';
import { CUSTOMER_NOTE_MAX_LENGTH } from '@/features/customer-management/utils/parseCreateCustomerBody';
import { CUSTOMER_NAME_MAX_LENGTH } from '@/features/customer-management/utils/parseCustomerContactFields';
import { toUsE164 } from '@/lib/formatUsPhone';

export type CustomerImportVehicle = {
  year: string;
  make: string;
  model: string;
};

export type CustomerImportRecord = {
  fullName: string;
  phone: string | null;
  email: string | null;
  address: CustomerAddress | null;
  notes: string | null;
  vehicles: CustomerImportVehicle[];
  warnings: string[];
};

export type CustomerImportPreview = {
  ready: CustomerImportRecord[];
  duplicates: { name: string }[];
  skipped: { name: string; reason: string }[];
};

export type CustomerImportExisting = {
  phone: string;
  email: string;
};

const STATE_BY_NAME: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  'washington dc': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

const STATE_CODES = new Set(Object.values(STATE_BY_NAME));

export function usImportPhoneDigits(raw: string): string | null {
  const e164 = toUsE164(expandScientific(raw.trim()));
  return e164 ? e164.slice(2) : null;
}

export function buildCustomerImportPreview(
  table: CustomerImportTable,
  mapping: readonly CustomerImportFieldId[],
  options: {
    existing: readonly CustomerImportExisting[];
    includeVehicles: boolean;
  }
): CustomerImportPreview {
  const skipped: { name: string; reason: string }[] = [];
  const partials: Draft[] = [];

  for (const row of table.rows) {
    const parsed = parseImportRow(row, mapping, options.includeVehicles);
    if (parsed.kind === 'empty') continue;
    if (parsed.kind === 'skip') {
      skipped.push({ name: parsed.name, reason: parsed.reason });
      continue;
    }
    partials.push(parsed);
  }

  const drafts = groupImportDrafts(partials);
  for (const draft of drafts) {
    if (draft.fullName) continue;
    skipped.push({ name: 'Unnamed customer', reason: 'Name is required.' });
  }

  const existingPhones = new Set<string>();
  const existingEmails = new Set<string>();
  for (const customer of options.existing) {
    const phone = usImportPhoneDigits(customer.phone);
    if (phone) existingPhones.add(phone);
    const email = customer.email.trim().toLowerCase();
    if (email) existingEmails.add(email);
  }

  const ready: CustomerImportRecord[] = [];
  const duplicates: { name: string }[] = [];
  for (const draft of drafts) {
    if (!draft.fullName) continue;
    const exists =
      (draft.phone !== null && existingPhones.has(draft.phone)) ||
      (draft.email !== null && existingEmails.has(draft.email));
    if (exists) {
      duplicates.push({ name: draft.fullName });
      continue;
    }
    ready.push(toRecord(draft));
  }

  return { ready, duplicates, skipped };
}

export function sanitizeCustomerImportRecord(
  input: unknown
): { ok: true; record: CustomerImportRecord } | { ok: false; reason: string } {
  if (!input || typeof input !== 'object') {
    return { ok: false, reason: 'Name is required.' };
  }
  const body = input as Record<string, unknown>;
  const fullName =
    typeof body.fullName === 'string' ? body.fullName.trim() : '';
  if (!fullName) return { ok: false, reason: 'Name is required.' };
  if (fullName.length > CUSTOMER_NAME_MAX_LENGTH) {
    return { ok: false, reason: 'Name is too long.' };
  }

  const phoneRaw = typeof body.phone === 'string' ? body.phone : '';
  const emailRaw = typeof body.email === 'string' ? body.email : '';
  const notesRaw = typeof body.notes === 'string' ? body.notes : '';
  const address = sanitizeAddress(body.address);
  const vehicles = sanitizeVehicles(body.vehicles);

  return {
    ok: true,
    record: {
      fullName: fullName.replace(/\s+/g, ' '),
      phone: phoneRaw.trim() ? usImportPhoneDigits(phoneRaw) : null,
      email: validImportEmail(emailRaw),
      address,
      notes: notesRaw.trim()
        ? notesRaw.trim().slice(0, CUSTOMER_NOTE_MAX_LENGTH)
        : null,
      vehicles,
      warnings: [],
    },
  };
}

export function selectCustomersToImport(
  records: readonly CustomerImportRecord[],
  existing: readonly CustomerImportExisting[]
): { create: CustomerImportRecord[]; skipped: number } {
  const phones = new Set<string>();
  const emails = new Set<string>();
  for (const customer of existing) {
    const phone = usImportPhoneDigits(customer.phone);
    if (phone) phones.add(phone);
    const email = customer.email.trim().toLowerCase();
    if (email) emails.add(email);
  }

  const create: CustomerImportRecord[] = [];
  let skipped = 0;
  for (const record of records) {
    const phoneTaken = record.phone !== null && phones.has(record.phone);
    const emailTaken = record.email !== null && emails.has(record.email);
    if (phoneTaken || emailTaken) {
      skipped += 1;
      continue;
    }
    create.push(record);
    if (record.phone) phones.add(record.phone);
    if (record.email) emails.add(record.email);
  }
  return { create, skipped };
}

type Draft = {
  fullName: string;
  phone: string | null;
  email: string | null;
  address: CustomerAddress | null;
  notes: string | null;
  vehicles: CustomerImportVehicle[];
  warnings: string[];
};

function parseImportRow(
  row: string[],
  mapping: readonly CustomerImportFieldId[],
  includeVehicles: boolean
):
  | { kind: 'empty' }
  | { kind: 'skip'; name: string; reason: string }
  | ({ kind: 'draft' } & Draft) {
  const value = (field: CustomerImportFieldId) => {
    const index = mapping.indexOf(field);
    return index >= 0 ? (row[index] ?? '').trim() : '';
  };
  const cells = mapping.map((field, index) =>
    field === 'ignore' ? '' : (row[index] ?? '').trim()
  );
  if (cells.every(cell => !cell)) return { kind: 'empty' };

  const warnings: string[] = [];
  const fullName = (
    value('full_name') ||
    [value('first_name'), value('last_name')].filter(Boolean).join(' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
  if (fullName.length > CUSTOMER_NAME_MAX_LENGTH) {
    return { kind: 'skip', name: fullName, reason: 'Name is too long.' };
  }

  const phoneRaw = value('phone');
  const phone = phoneRaw ? usImportPhoneDigits(phoneRaw) : null;
  if (phoneRaw && !phone) {
    warnings.push("Phone isn't a US number, so it was left blank.");
  }

  const emailRaw = value('email');
  const email = emailRaw ? validImportEmail(emailRaw) : null;
  if (emailRaw && !email) {
    warnings.push("Email wasn't valid, so it was left blank.");
  }

  const address = readAddress(value, warnings);
  const notesRaw = value('notes');
  let notes: string | null = null;
  if (notesRaw) {
    notes = notesRaw.slice(0, CUSTOMER_NOTE_MAX_LENGTH).trim();
    if (notesRaw.length > CUSTOMER_NOTE_MAX_LENGTH) {
      warnings.push(
        `Notes were shortened to ${CUSTOMER_NOTE_MAX_LENGTH} characters.`
      );
    }
  }

  const vehicles = includeVehicles ? readVehicles(value, warnings) : [];

  return {
    kind: 'draft',
    fullName,
    phone,
    email,
    address,
    notes,
    vehicles,
    warnings,
  };
}

function readAddress(
  value: (field: CustomerImportFieldId) => string,
  warnings: string[]
): CustomerAddress | null {
  const street = value('street');
  const unit = value('unit');
  const city = value('city');
  const stateRaw = value('state');
  const zipRaw = value('zip');
  const line = value('address');
  const touched = Boolean(street || unit || city || stateRaw || zipRaw || line);
  if (!touched) return null;

  const structured = buildAddress({
    street,
    unit,
    city,
    state: normalizeImportState(stateRaw),
    zip: normalizeImportZip(zipRaw),
  });
  if (structured) return structured;
  if (line) {
    const parsed = parseUsAddressLine(line);
    if (parsed) return parsed;
  }
  warnings.push('Address was incomplete, so it was left blank.');
  return null;
}

function buildAddress(input: {
  street: string;
  unit: string;
  city: string;
  state: string | null;
  zip: string | null;
}): CustomerAddress | null {
  if (!input.street || !input.city || !input.state || !input.zip) return null;
  if (
    input.street.length > 120 ||
    input.city.length > 80 ||
    input.unit.length > 50
  ) {
    return null;
  }
  return {
    street: input.street,
    unit: input.unit,
    city: input.city,
    state: input.state,
    zip: input.zip,
  };
}

function parseUsAddressLine(value: string): CustomerAddress | null {
  const parts = value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length < 3) return null;
  const last = parts[parts.length - 1] ?? '';
  const match = last.match(/^(.+?)\s+(\d{5})(?:-\d{4})?$/);
  if (!match) return null;
  const state = normalizeImportState(match[1] ?? '');
  const zip = match[2] ?? null;
  if (!state || !zip) return null;
  const city = parts[parts.length - 2] ?? '';
  const streetParts = parts.slice(0, -2);
  let unit = '';
  let street = streetParts.join(', ');
  if (streetParts.length >= 2) {
    const maybeUnit = streetParts[streetParts.length - 1] ?? '';
    if (/^(apt|apartment|unit|suite|ste|#)\b/i.test(maybeUnit)) {
      unit = maybeUnit;
      street = streetParts.slice(0, -1).join(', ');
    }
  }
  return buildAddress({ street, unit, city, state, zip });
}

function readVehicles(
  value: (field: CustomerImportFieldId) => string,
  warnings: string[]
): CustomerImportVehicle[] {
  const vehicles: CustomerImportVehicle[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const vehicle = parseVehicleLabel(raw);
    if (!vehicle) {
      if (raw.trim())
        warnings.push("A vehicle wasn't recognized, so it was left off.");
      return;
    }
    const key =
      `${vehicle.year}|${vehicle.make}|${vehicle.model}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    vehicles.push(vehicle);
  };

  for (const part of value('vehicle').split(/[;\n|]/)) push(part);
  const year = value('vehicle_year');
  const make = value('vehicle_make');
  const model = value('vehicle_model');
  if (year || make || model)
    push([year, make, model].filter(Boolean).join(' '));
  return vehicles.slice(0, 20);
}

function parseVehicleLabel(raw: string): CustomerImportVehicle | null {
  const match = raw.trim().match(/^(\d{4})\s+(\S+)\s+(.+)$/);
  if (!match) return null;
  const year = Number(match[1]);
  const make = (match[2] ?? '').trim();
  const model = (match[3] ?? '').trim();
  if (year < 1900 || year > 2099) return null;
  if (!make || !model || make.length > 40 || model.length > 40) return null;
  return { year: String(year), make, model };
}

function validImportEmail(raw: string): string | null {
  const email = raw.trim();
  if (!email || !isValidEmail(email)) return null;
  return normalizeEmailForLookup(email);
}

export function normalizeImportState(raw: string): string | null {
  const compact = raw
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
  if (!compact) return null;
  if (/^[a-z]{2}$/.test(compact)) {
    const code = compact.toUpperCase();
    return STATE_CODES.has(code) ? code : null;
  }
  return STATE_BY_NAME[compact] ?? null;
}

export function normalizeImportZip(raw: string): string | null {
  const digits = expandScientific(raw.trim()).replace(/\D/g, '');
  if (digits.length === 5 || digits.length === 9) return digits.slice(0, 5);
  return null;
}

function expandScientific(raw: string): string {
  const compact = raw.replace(/\s/g, '');
  if (!/^\d+(\.\d+)?e\+\d+$/i.test(compact)) return raw;
  const value = Number(compact);
  if (!Number.isFinite(value)) return raw;
  return String(Math.round(value));
}

function groupImportDrafts(partials: Draft[]): Draft[] {
  const parent = partials.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root] ?? root;
    parent[index] = root;
    return root;
  };
  const union = (left: number, right: number) => {
    const a = find(left);
    const b = find(right);
    if (a !== b) parent[b] = a;
  };
  const phoneOwner = new Map<string, number>();
  const emailOwner = new Map<string, number>();
  partials.forEach((draft, index) => {
    if (draft.phone) {
      const other = phoneOwner.get(draft.phone);
      if (other === undefined) phoneOwner.set(draft.phone, index);
      else union(other, index);
    }
    if (draft.email) {
      const other = emailOwner.get(draft.email);
      if (other === undefined) emailOwner.set(draft.email, index);
      else union(other, index);
    }
  });

  const groups = new Map<number, Draft>();
  partials.forEach((draft, index) => {
    const root = find(index);
    const current = groups.get(root);
    if (!current) {
      groups.set(root, {
        ...draft,
        vehicles: [...draft.vehicles],
        warnings: [...draft.warnings],
      });
      return;
    }
    mergeDraft(current, draft);
  });
  return [...groups.values()];
}

function mergeDraft(target: Draft, extra: Draft) {
  target.fullName = target.fullName || extra.fullName;
  target.phone = target.phone ?? extra.phone;
  target.email = target.email ?? extra.email;
  target.address = target.address ?? extra.address;
  target.notes = target.notes ?? extra.notes;
  const seen = new Set(
    target.vehicles.map(vehicle =>
      `${vehicle.year}|${vehicle.make}|${vehicle.model}`.toLowerCase()
    )
  );
  for (const vehicle of extra.vehicles) {
    const key =
      `${vehicle.year}|${vehicle.make}|${vehicle.model}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    target.vehicles.push(vehicle);
  }
  for (const warning of extra.warnings) {
    if (!target.warnings.includes(warning)) target.warnings.push(warning);
  }
}

function toRecord(draft: Draft): CustomerImportRecord {
  return {
    fullName: draft.fullName,
    phone: draft.phone,
    email: draft.email,
    address: draft.address,
    notes: draft.notes,
    vehicles: draft.vehicles.slice(0, 20),
    warnings: draft.warnings,
  };
}

function sanitizeAddress(value: unknown): CustomerAddress | null {
  if (!value || typeof value !== 'object') return null;
  const address = value as Partial<CustomerAddress>;
  return buildAddress({
    street: typeof address.street === 'string' ? address.street.trim() : '',
    unit: typeof address.unit === 'string' ? address.unit.trim() : '',
    city: typeof address.city === 'string' ? address.city.trim() : '',
    state:
      typeof address.state === 'string'
        ? normalizeImportState(address.state)
        : null,
    zip:
      typeof address.zip === 'string' ? normalizeImportZip(address.zip) : null,
  });
}

function sanitizeVehicles(value: unknown): CustomerImportVehicle[] {
  if (!Array.isArray(value)) return [];
  const vehicles: CustomerImportVehicle[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const vehicle = item as Partial<CustomerImportVehicle>;
    const parsed = parseVehicleLabel(
      [vehicle.year, vehicle.make, vehicle.model]
        .filter(part => typeof part === 'string')
        .join(' ')
    );
    if (parsed) vehicles.push(parsed);
    if (vehicles.length === 20) break;
  }
  return vehicles;
}
