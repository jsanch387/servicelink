/**
 * Editable placeholder defaults for onboarding Step 2 (Add a service).
 * Keyed by business type from Step 1; falls back to a generic service.
 */

export interface PlaceholderServiceDefaults {
  name: string;
  description: string;
  price: string;
  durationMinutes: number;
}

const GENERIC_PLACEHOLDER: PlaceholderServiceDefaults = {
  name: 'Standard Service',
  description:
    'Describe what customers get with this service. You can edit this anytime from your dashboard.',
  price: '100',
  durationMinutes: 60,
};

const PLACEHOLDER_BY_BUSINESS_TYPE: Record<string, PlaceholderServiceDefaults> =
  {
    'Auto & Detailing': {
      name: 'Full Detail',
      description:
        'Exterior wash, interior vacuum, and wipe-down. Edit the name, price, and details to match your offering.',
      price: '150',
      durationMinutes: 120,
    },
    'Pressure Washing': {
      name: 'Driveway & Patio Wash',
      description:
        'Pressure wash for driveways, patios, or siding. Update the description and price to fit your services.',
      price: '200',
      durationMinutes: 120,
    },
    'Cleaning Services': {
      name: 'Standard Cleaning',
      description:
        'General cleaning for homes or offices. Customize the scope, price, and duration before you go live.',
      price: '120',
      durationMinutes: 120,
    },
    'Trash & Bin Cleaning': {
      name: 'Bin Cleaning',
      description:
        'Trash and recycling bin cleaning service. Adjust the details to match how you price and schedule jobs.',
      price: '25',
      durationMinutes: 30,
    },
    'Lawn Care & Landscaping': {
      name: 'Lawn Mowing',
      description:
        'Regular lawn mowing and basic yard care. Edit the name, price, and duration to reflect your packages.',
      price: '50',
      durationMinutes: 60,
    },
    Beauty: {
      name: 'Basic Service',
      description:
        'Your core beauty or grooming service. Update the name, price, and description so customers know what to book.',
      price: '75',
      durationMinutes: 60,
    },
    'Mobile Repair': {
      name: 'Standard Repair',
      description:
        'On-site repair or maintenance visit. Customize the service name, price, and estimated time for your trade.',
      price: '100',
      durationMinutes: 60,
    },
    'Window Tinting': {
      name: 'Window Tinting',
      description:
        'Professional window tint installation. Edit the details to match your packages and typical job length.',
      price: '200',
      durationMinutes: 120,
    },
  };

export function getDefaultPlaceholderService(
  businessType?: string | null
): PlaceholderServiceDefaults {
  const key = businessType?.trim();
  if (key && PLACEHOLDER_BY_BUSINESS_TYPE[key]) {
    return PLACEHOLDER_BY_BUSINESS_TYPE[key];
  }
  return GENERIC_PLACEHOLDER;
}
