import {
  BanknotesIcon,
  CalendarDaysIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';

export type WorkshopTestimonial = {
  id: string;
  name: string;
  business: string;
  initials: string;
  quote: string;
};

export type WorkshopPlaybookStep = {
  id: string;
  step: string;
  title: string;
  description: string;
};

export type WorkshopProductBenefit = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export const WORKSHOP_WATCH_INTRO =
  'You are in. Watch the full class, then use the playbook below to turn ad clicks into booked jobs.';

export const WORKSHOP_POST_VIDEO_HOOK = {
  title: 'Send your ad traffic to a page that actually books',
  description:
    'The masterclass ends with one move: stop sending people to your DMs. Give every click a professional booking link with deposits built in.',
} as const;

export const WORKSHOP_PLAYBOOK_STEPS: readonly WorkshopPlaybookStep[] = [
  {
    id: 'target',
    step: '1',
    title: 'Run the $10/day local ad',
    description:
      'Use the radius and creative tips from the video so only nearby car owners see your offer.',
  },
  {
    id: 'link',
    step: '2',
    title: 'Send clicks to one booking link',
    description:
      'Replace “DM to book” with a single ServiceLink page: services, availability, and checkout in one flow.',
  },
  {
    id: 'deposit',
    step: '3',
    title: 'Lock the appointment with a deposit',
    description:
      'Confirmed bookings hit your calendar. Tire-kickers and no-shows drop when money is on the line.',
  },
] as const;

export const WORKSHOP_TESTIMONIALS: readonly WorkshopTestimonial[] = [
  {
    id: 'marcus',
    name: 'Marcus T.',
    business: 'Elite Mobile Detail · Austin, TX',
    initials: 'MT',
    quote:
      'I pointed my Meta ad at my ServiceLink instead of Instagram DMs. First week I had 6 deposit bookings without answering a single “how much?” message.',
  },
  {
    id: 'jenna',
    name: 'Jenna R.',
    business: 'Clear Coat Studio · Phoenix, AZ',
    initials: 'JR',
    quote:
      'The video’s $10/day setup was dead simple. My link handles quotes for bigger jobs and straight booking for maintenance washes.',
  },
  {
    id: 'andre',
    name: 'Andre P.',
    business: 'Shine Squad Mobile · Atlanta, GA',
    initials: 'AP',
    quote:
      'I was skeptical about another tool. Took ten minutes to publish my page. Now my calendar fills while I’m on jobs.',
  },
] as const;

export const WORKSHOP_PRODUCT_BENEFITS: readonly WorkshopProductBenefit[] = [
  {
    id: 'booking-link',
    title: 'One link for ads, bio, and texts',
    description:
      'Share the same booking page everywhere so every lead lands in one professional funnel.',
    icon: LinkIcon,
  },
  {
    id: 'calendar',
    title: 'Self-serve scheduling',
    description:
      'Customers pick a time that works. You stop playing phone tag and chasing “still interested?” replies.',
    icon: CalendarDaysIcon,
  },
  {
    id: 'deposits',
    title: 'Deposits and payments built in',
    description:
      'Collect upfront to confirm the slot — exactly what the masterclass recommends after your ads go live.',
    icon: BanknotesIcon,
  },
] as const;

export const WORKSHOP_OFFER = {
  title: 'Launch your booking link before your next ad goes live',
  description:
    'Free to start. Set up in minutes. Built for mobile detailers and local service businesses running Meta ads.',
  primaryCta: 'Create your free ServiceLink',
  socialProofNote:
    'Stories from mobile service pros using ServiceLink. Individual results vary.',
} as const;
