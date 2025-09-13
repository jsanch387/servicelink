import { OnboardingStep } from '@/types';

export const ONBOARDING_STEPS: Omit<OnboardingStep, 'isCompleted'>[] = [
  {
    id: 1,
    title: 'Welcome',
    description: 'Get started with your business profile',
    isRequired: true,
  },
  {
    id: 2,
    title: 'Business Info',
    description: 'Tell us about your business',
    isRequired: true,
  },
  {
    id: 3,
    title: 'Services',
    description: 'Add your services and pricing',
    isRequired: true,
  },
  {
    id: 4,
    title: 'Portfolio',
    description: 'Showcase your best work',
    isRequired: false,
  },
  {
    id: 5,
    title: 'Contact',
    description: 'How customers can reach you',
    isRequired: true,
  },
];

export const BUSINESS_TYPES = [
  'Auto Detailing',
  'Lawn Care',
  'Pet Grooming',
  'Barber Shop',
  'Cleaning Services',
  'Handyman Services',
  'Landscaping',
  'House Painting',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Other',
] as const;

export const SERVICE_CATEGORIES = [
  'Basic Service',
  'Premium Service',
  'Specialty Service',
  'Maintenance',
  'Repair',
  'Installation',
  'Consultation',
  'Emergency Service',
] as const;

export const PORTFOLIO_CATEGORIES = [
  'Before & After',
  'Project Showcase',
  'Customer Work',
  'Process',
  'Results',
  'Equipment',
  'Team',
] as const;
