import { MARKETING_IMAGES } from '@/constants/marketingImages';

export type LandingShowcaseFrame = 'phone' | 'browser';
export type LandingShowcaseMock = 'sms' | 'dashboard' | null;

export interface LandingProductShowcase {
  id: string;
  headline: string;
  line: string;
  frame: LandingShowcaseFrame;
  image: string | null;
  imageAlt: string;
  mock: LandingShowcaseMock;
  placeholderLabel: string;
}

export const LANDING_PRODUCT_SHOWCASES: LandingProductShowcase[] = [
  {
    id: 'booking-link',
    headline: 'They book from your link.',
    line: 'Services. Times. Pay. No DMs.',
    frame: 'phone',
    image: MARKETING_IMAGES.features.bookingLink,
    imageAlt: 'Customer booking page with services and Book',
    mock: null,
    placeholderLabel: 'Booking link screenshot',
  },
  {
    id: 'job-texts',
    headline: 'They get texts.',
    line: 'Booked. On the way. Done.',
    frame: 'phone',
    image: null,
    imageAlt: '',
    mock: 'sms',
    placeholderLabel: 'Customer text updates screenshot',
  },
  {
    id: 'day',
    headline: 'You see the day.',
    line: 'Jobs, money, who’s next.',
    frame: 'browser',
    image: null,
    imageAlt: '',
    mock: 'dashboard',
    placeholderLabel: 'Dashboard screenshot',
  },
  {
    id: 'deposits',
    headline: 'Deposits lock the job.',
    line: 'No-shows stop showing up.',
    frame: 'phone',
    image: MARKETING_IMAGES.features.payments,
    imageAlt: 'Deposit and pay-in-app checkout',
    mock: null,
    placeholderLabel: 'Payments screenshot',
  },
];
