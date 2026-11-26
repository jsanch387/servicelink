/** Shared sample shop for industry-landing product mocks. Fictional, not a live tenant. */
export const SAMPLE_SHOP = {
  name: 'Apex Mobile Detail',
  slug: 'apex',
  url: 'myservicelink.app/apex',
  city: 'Austin, TX',
  coverage: 'Austin, TX · 15 mi',
  shopAddress: '412 Barton Springs Rd, Austin, TX',
} as const;

export const SAMPLE_PACKAGES = [
  {
    name: 'Interior detail',
    duration: '2 hr',
    price: '$189',
    from: true,
    selected: true,
  },
  {
    name: 'Exterior wash',
    duration: '1 hr',
    price: '$89',
    from: true,
    selected: false,
  },
  {
    name: 'Full detail',
    duration: '3.5 hr',
    price: '$279',
    from: true,
    selected: false,
  },
] as const;

export const SAMPLE_SIZES = [
  { label: 'Sedan', duration: '1 hr 45 min', price: '$159', selected: false },
  { label: 'SUV', duration: '2 hr', price: '$189', selected: true },
  { label: 'Truck', duration: '2 hr 15 min', price: '$209', selected: false },
] as const;

export const SAMPLE_SLOTS = [
  { time: '9 AM', selected: false },
  { time: '11:30 AM', selected: true },
  { time: '2 PM', selected: false },
  { time: '4 PM', selected: false },
] as const;

export const SAMPLE_DATES = [
  { dow: 'Wed', day: '25', selected: false },
  { dow: 'Thu', day: '26', selected: true },
  { dow: 'Fri', day: '27', selected: false },
  { dow: 'Sat', day: '28', selected: false },
] as const;

export const SAMPLE_JOBS = [
  {
    customer: 'Sarah M.',
    service: 'Interior detail',
    vehicle: '2019 Tahoe',
    time: '11:30 AM',
    address: '412 Barton Springs Rd',
    status: 'Confirmed',
  },
  {
    customer: 'James R.',
    service: 'Ceramic boost',
    vehicle: '2022 Civic',
    time: '2:00 PM',
    address: 'South Congress',
    status: 'Confirmed',
  },
  {
    customer: 'Mike A.',
    service: 'SUV detail',
    vehicle: 'F-150',
    time: '4:30 PM',
    address: 'East Austin',
    status: 'Confirmed',
  },
] as const;

export const SAMPLE_CUSTOMERS = [
  {
    name: 'Sarah M.',
    vehicle: '2019 Tahoe',
    visits: '4',
    spent: '$1,240',
    status: 'Returning',
  },
  {
    name: 'James R.',
    vehicle: '2022 Civic',
    visits: '2',
    spent: '$420',
    status: 'Returning',
  },
  {
    name: 'Mike A.',
    vehicle: 'F-150',
    visits: '1',
    spent: '$279',
    status: 'New',
  },
] as const;
