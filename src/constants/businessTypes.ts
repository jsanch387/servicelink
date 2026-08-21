/**
 * Industry catalog — the app-wide context for what to load.
 *
 * Store only `business_profiles.business_type` (the dropdown value).
 * Resolve everything else here: booking subject, asset fields, onboarding
 * copy. Adding trash-bin cleaning, poop scooping, or massage later is a new
 * catalog row — not a new table or column.
 */

export type IndustryTemplate = 'vehicle' | 'pet' | 'property' | 'person';

/** What the booking form collects for each job. */
export type IndustryAssetKind = 'vehicle' | 'pet' | 'property' | 'none';

export interface IndustryAssetField {
  key: string;
  label: string;
  required: boolean;
}

export interface IndustryOnboardingCopy {
  businessNamePlaceholder: string;
  typeHelper: string;
  serviceStepTitle: string;
  serviceStepSubtitle: string;
  serviceNamePlaceholder: string;
  hoursSubtitle: string;
  slugExample: string;
  goLiveSubtitle: string;
  firstService: {
    name: string;
    description: string;
    price: string;
    durationMinutes: number;
  };
}

export interface BusinessTypeOption {
  value: string;
  label: string;
}

export interface BusinessTypeDefinition {
  /** Value stored on `business_profiles.business_type`. */
  value: string;
  /** Dropdown / settings label. */
  label: string;
  slug: string;
  template: IndustryTemplate;
  asset: {
    kind: IndustryAssetKind;
    fields: readonly IndustryAssetField[];
  };
  /** Shown to new signups. Legacy types stay resolvable but hidden. */
  offeredAtSignup: boolean;
  /** Older or drifted strings that should resolve to this type. */
  aliases?: readonly string[];
  onboarding: IndustryOnboardingCopy;
}

export interface BusinessIndustry {
  value: string | null;
  label: string;
  slug: string;
  template: IndustryTemplate;
  assetKind: IndustryAssetKind;
  assetFields: readonly IndustryAssetField[];
  showVehicleFields: boolean;
  showPetFields: boolean;
  onboarding: IndustryOnboardingCopy;
}

export const VEHICLE_ASSET_FIELDS: readonly IndustryAssetField[] = [
  { key: 'year', label: 'Year', required: true },
  { key: 'make', label: 'Make', required: true },
  { key: 'model', label: 'Model', required: true },
];

export const PET_ASSET_FIELDS: readonly IndustryAssetField[] = [
  { key: 'name', label: 'Pet name', required: true },
  { key: 'species', label: 'Species', required: true },
  { key: 'breed', label: 'Breed', required: true },
  { key: 'size', label: 'Size', required: true },
];

/**
 * Property jobs already collect an address on the booking flow.
 * Add fields here later (square footage, beds, bin count) — no schema change.
 */
export const PROPERTY_ASSET_FIELDS: readonly IndustryAssetField[] = [];

const GENERIC_ONBOARDING: IndustryOnboardingCopy = {
  businessNamePlaceholder: 'e.g. your business name',
  typeHelper: 'We use this so your booking form matches what you offer.',
  serviceStepTitle: 'Add at least one service',
  serviceStepSubtitle:
    'Fill in one service and tap Next — you can add more after onboarding.',
  serviceNamePlaceholder: 'e.g. Standard service',
  hoursSubtitle: "Customers will only see times when you're free.",
  slugExample: 'my-business',
  goLiveSubtitle: 'Share it. Get booked.',
  firstService: {
    name: 'Standard Service',
    description:
      'Describe what customers get with this service. You can edit this anytime from your dashboard.',
    price: '100',
    durationMinutes: 60,
  },
};

const VEHICLE_ONBOARDING: IndustryOnboardingCopy = {
  ...GENERIC_ONBOARDING,
  businessNamePlaceholder: 'e.g. Shine Auto Detailing',
  typeHelper: 'Customers will add their vehicle when they book.',
  serviceNamePlaceholder: 'e.g. Full detail, Interior',
  slugExample: 'elite-detail',
  firstService: {
    name: 'Full Detail',
    description:
      'Exterior wash, interior vacuum, and wipe-down. Edit the name, price, and details to match your offering.',
    price: '150',
    durationMinutes: 120,
  },
};

const PET_ONBOARDING: IndustryOnboardingCopy = {
  businessNamePlaceholder: 'e.g. Paws Mobile Grooming',
  typeHelper:
    'Customers will add their pet — name, breed, and size — when they book.',
  serviceStepTitle: 'Add at least one grooming service',
  serviceStepSubtitle:
    'Start with the groom you book most. You can add baths, haircuts, and add-ons later.',
  serviceNamePlaceholder: 'e.g. Full Groom, Bath & Brush',
  hoursSubtitle: "Pet owners will only see times when you're free.",
  slugExample: 'paws-grooming',
  goLiveSubtitle: 'Share it. Let pet owners book.',
  firstService: {
    name: 'Full Groom',
    description:
      'Bath, haircut, and nail trim. Edit the name, price, and time to match how you book pets.',
    price: '75',
    durationMinutes: 90,
  },
};

const PROPERTY_ONBOARDING: IndustryOnboardingCopy = {
  ...GENERIC_ONBOARDING,
  businessNamePlaceholder: 'e.g. Bright Side Pressure Washing',
  typeHelper: 'Customers will add their address when they book.',
  serviceNamePlaceholder: 'e.g. Driveway wash',
  slugExample: 'bright-side',
};

const FALLBACK_INDUSTRY: BusinessIndustry = {
  value: null,
  label: 'Business',
  slug: 'unknown',
  template: 'person',
  assetKind: 'none',
  assetFields: [],
  showVehicleFields: false,
  showPetFields: false,
  onboarding: GENERIC_ONBOARDING,
};

const BUSINESS_TYPE_CATALOG: readonly BusinessTypeDefinition[] = [
  {
    value: 'Auto & Detailing',
    label: 'Auto detailing',
    slug: 'auto_detailing',
    template: 'vehicle',
    asset: { kind: 'vehicle', fields: VEHICLE_ASSET_FIELDS },
    offeredAtSignup: true,
    aliases: ['Mobile Detailing', 'Automotive', 'Service Provider'],
    onboarding: VEHICLE_ONBOARDING,
  },
  {
    value: 'Window Tinting',
    label: 'Window tinting',
    slug: 'window_tinting',
    template: 'vehicle',
    asset: { kind: 'vehicle', fields: VEHICLE_ASSET_FIELDS },
    offeredAtSignup: true,
    onboarding: {
      ...VEHICLE_ONBOARDING,
      businessNamePlaceholder: 'e.g. ClearView Tint',
      serviceNamePlaceholder: 'e.g. Full vehicle tint',
      slugExample: 'clearview-tint',
      firstService: {
        name: 'Window Tinting',
        description:
          'Professional window tint installation. Edit the details to match your packages and typical job length.',
        price: '200',
        durationMinutes: 120,
      },
    },
  },
  {
    value: 'Mobile Repair',
    label: 'Mobile mechanic / repair',
    slug: 'mobile_repair',
    template: 'vehicle',
    asset: { kind: 'vehicle', fields: VEHICLE_ASSET_FIELDS },
    offeredAtSignup: true,
    onboarding: {
      ...VEHICLE_ONBOARDING,
      businessNamePlaceholder: 'e.g. On-Site Auto Repair',
      serviceNamePlaceholder: 'e.g. Diagnostic, Oil change',
      slugExample: 'onsite-repair',
      firstService: {
        name: 'Standard Repair',
        description:
          'On-site repair or maintenance visit. Customize the service name, price, and estimated time for your trade.',
        price: '100',
        durationMinutes: 60,
      },
    },
  },
  {
    value: 'Pet Grooming',
    label: 'Pet grooming',
    slug: 'pet_grooming',
    template: 'pet',
    asset: { kind: 'pet', fields: PET_ASSET_FIELDS },
    offeredAtSignup: true,
    onboarding: PET_ONBOARDING,
  },
  {
    value: 'Pressure Washing',
    label: 'Pressure washing',
    slug: 'pressure_washing',
    template: 'property',
    asset: { kind: 'property', fields: PROPERTY_ASSET_FIELDS },
    offeredAtSignup: true,
    onboarding: {
      ...PROPERTY_ONBOARDING,
      firstService: {
        name: 'Driveway & Patio Wash',
        description:
          'Pressure wash for driveways, patios, or siding. Update the description and price to fit your services.',
        price: '200',
        durationMinutes: 120,
      },
    },
  },
  {
    value: 'Cleaning Services',
    label: 'Cleaning Services',
    slug: 'cleaning_services',
    template: 'property',
    asset: { kind: 'property', fields: PROPERTY_ASSET_FIELDS },
    offeredAtSignup: false,
    onboarding: {
      ...PROPERTY_ONBOARDING,
      firstService: {
        name: 'Standard Cleaning',
        description:
          'General cleaning for homes or offices. Customize the scope, price, and duration before you go live.',
        price: '120',
        durationMinutes: 120,
      },
    },
  },
  {
    value: 'Trash & Bin Cleaning',
    label: 'Trash & Bin Cleaning',
    slug: 'trash_bin_cleaning',
    template: 'property',
    asset: { kind: 'property', fields: PROPERTY_ASSET_FIELDS },
    offeredAtSignup: false,
    onboarding: {
      ...PROPERTY_ONBOARDING,
      businessNamePlaceholder: 'e.g. Fresh Bin Co',
      firstService: {
        name: 'Bin Cleaning',
        description:
          'Trash and recycling bin cleaning service. Adjust the details to match how you price and schedule jobs.',
        price: '25',
        durationMinutes: 30,
      },
    },
  },
  {
    value: 'Lawn Care & Landscaping',
    label: 'Lawn Care & Landscaping',
    slug: 'lawn_care',
    template: 'property',
    asset: { kind: 'property', fields: PROPERTY_ASSET_FIELDS },
    offeredAtSignup: false,
    onboarding: {
      ...PROPERTY_ONBOARDING,
      businessNamePlaceholder: 'e.g. Green Line Lawn',
      serviceNamePlaceholder: 'e.g. Lawn mowing',
      firstService: {
        name: 'Lawn Mowing',
        description:
          'Regular lawn mowing and basic yard care. Edit the name, price, and duration to reflect your packages.',
        price: '50',
        durationMinutes: 60,
      },
    },
  },
  {
    value: 'Beauty',
    label: 'Beauty',
    slug: 'beauty',
    template: 'person',
    asset: { kind: 'none', fields: [] },
    offeredAtSignup: false,
    onboarding: {
      ...GENERIC_ONBOARDING,
      businessNamePlaceholder: 'e.g. Studio Lane',
      firstService: {
        name: 'Basic Service',
        description:
          'Your core beauty or personal-care service. Update the name, price, and description so customers know what to book.',
        price: '75',
        durationMinutes: 60,
      },
    },
  },
  {
    value: 'Other',
    label: 'Other',
    slug: 'other',
    template: 'person',
    asset: { kind: 'none', fields: [] },
    offeredAtSignup: false,
    onboarding: GENERIC_ONBOARDING,
  },
];

function normalizeTypeKey(value: string): string {
  return value.trim().toLowerCase();
}

function definitionToIndustry(
  definition: BusinessTypeDefinition
): BusinessIndustry {
  return {
    value: definition.value,
    label: definition.label,
    slug: definition.slug,
    template: definition.template,
    assetKind: definition.asset.kind,
    assetFields: definition.asset.fields,
    showVehicleFields: definition.asset.kind === 'vehicle',
    showPetFields: definition.asset.kind === 'pet',
    onboarding: definition.onboarding,
  };
}

export function findBusinessTypeDefinition(
  businessType: string | null | undefined
): BusinessTypeDefinition | null {
  if (businessType == null || !businessType.trim()) return null;
  const key = normalizeTypeKey(businessType);

  for (const definition of BUSINESS_TYPE_CATALOG) {
    if (normalizeTypeKey(definition.value) === key) return definition;
    if (definition.aliases?.some(alias => normalizeTypeKey(alias) === key)) {
      return definition;
    }
  }

  return null;
}

/** App-wide industry context from a stored `business_type`. */
export function resolveBusinessIndustry(
  businessType: string | null | undefined
): BusinessIndustry {
  const definition = findBusinessTypeDefinition(businessType);
  return definition ? definitionToIndustry(definition) : FALLBACK_INDUSTRY;
}

export function getIndustryOnboardingCopy(
  businessType: string | null | undefined
): IndustryOnboardingCopy {
  return resolveBusinessIndustry(businessType).onboarding;
}

/** Canonical stored value when the string is a known type or alias. */
export function canonicalizeBusinessType(
  businessType: string | null | undefined
): string | null {
  const trimmed = businessType?.trim() ?? '';
  if (!trimmed) return null;
  return findBusinessTypeDefinition(trimmed)?.value ?? trimmed;
}

export function isAllowedBusinessTypeValue(
  businessType: string | null | undefined
): boolean {
  return findBusinessTypeDefinition(businessType) != null;
}

function toSelectOption(
  definition: BusinessTypeDefinition
): BusinessTypeOption {
  return { value: definition.value, label: definition.label };
}

/** New signups — only types we can actually serve. */
export const BUSINESS_TYPE_OPTIONS: BusinessTypeOption[] =
  BUSINESS_TYPE_CATALOG.filter(definition => definition.offeredAtSignup).map(
    toSelectOption
  );

/**
 * Dropdown options for settings / resume. Offered types plus the current
 * stored value when it is a hidden legacy type.
 */
export function getBusinessTypeSelectOptions(
  currentValue?: string | null
): BusinessTypeOption[] {
  const options = [...BUSINESS_TYPE_OPTIONS];
  const current = currentValue?.trim();
  if (!current) return options;
  if (options.some(option => option.value === current)) return options;

  const definition = findBusinessTypeDefinition(current);
  return [
    {
      value: current,
      label: definition?.label ?? current,
    },
    ...options,
  ];
}

/**
 * True when the booking form should collect year / make / model.
 * Window tinting and mobile repair share this with detailing.
 */
export function isVehicleRelatedBusinessType(
  businessType: string | null | undefined
): boolean {
  return resolveBusinessIndustry(businessType).showVehicleFields;
}

export function isPetRelatedBusinessType(
  businessType: string | null | undefined
): boolean {
  return resolveBusinessIndustry(businessType).showPetFields;
}
