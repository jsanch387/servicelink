/** Hook under the page title — speak to the moment they know. */
export const AUTOMATION_PAGE_DESCRIPTION =
  'Answer Instagram DMs while you’re on a job.';

export type AutomationDmMessage = {
  from: 'customer' | 'shop';
  text: string;
};

export type AutomationIntroSlideKind = 'story' | 'payoff' | 'demo' | 'trust';

export type AutomationIntroSlide = {
  id: string;
  kind: AutomationIntroSlideKind;
  title: string;
  /** One beat under the title — optional. */
  subtitle?: string;
  lines?: readonly string[];
  demoMessages?: readonly AutomationDmMessage[];
  demoOutcome?: string;
};

/** Story order: pain → cool idea → see it → trust → connect. */
export const AUTOMATION_INTRO_SLIDES: readonly AutomationIntroSlide[] = [
  {
    id: 'pain',
    kind: 'story',
    title: 'You’re on a job. Your phone buzzes.',
    subtitle: '“How much for a detail?”',
    lines: [
      'You can’t stop and type every reply.',
      'Wait too long and they book someone else.',
    ],
  },
  {
    id: 'payoff',
    kind: 'payoff',
    title: 'What if Instagram answered for you?',
    lines: [
      'ServiceLink replies in your DMs with your real prices.',
      'It works while you’re on a job.',
    ],
  },
  {
    id: 'demo',
    kind: 'demo',
    title: 'While you’re busy…',
    subtitle: 'This is what happens in your DMs:',
    demoMessages: [
      { from: 'customer', text: 'How much for a full detail?' },
      {
        from: 'shop',
        text: 'Full detail is $275. What day works for you?',
      },
      { from: 'customer', text: 'Friday at 9' },
      {
        from: 'shop',
        text: 'Perfect — you’re on the schedule for Friday 9am.',
      },
    ],
    demoOutcome: 'You get the booking in your app. No back-and-forth from you.',
  },
  {
    id: 'trust',
    kind: 'trust',
    title: 'Nothing weird.',
    lines: [
      'Only replies when someone messages you first.',
      'Does not post on your page.',
      'You still see every message in Instagram.',
    ],
  },
] as const;

export const AUTOMATION_CAROUSEL_NEXT = 'Next';
export const AUTOMATION_CAROUSEL_BACK = 'Back';
export const AUTOMATION_CAROUSEL_SKIP = 'I’m ready — connect';

export const AUTOMATION_CONNECT_SLIDE_TITLE = 'Hook up your shop Instagram';

export const AUTOMATION_CONNECT_SLIDE_LEAD =
  'Takes about a minute. Use the account customers already DM.';

export const AUTOMATION_SETUP_CTA_CONNECT = 'Connect Instagram';

export const AUTOMATION_SETUP_FOOTNOTE =
  'You’ll sign in with Facebook once — Instagram requires it. We never post for you.';

export const AUTOMATION_BOOKING_LINK_TIP =
  'Set up your booking link first so prices are ready when customers ask.';

export const AUTOMATION_CONNECTED_TITLE = 'You’re all set';

export const AUTOMATION_CONNECTED_LEAD =
  'New DMs on this account get handled for you.';

export const AUTOMATION_CONNECTED_TEST_TIP =
  'Try it: DM your own shop — “how much for a detail?” — and watch it work.';

export const AUTOMATION_DISCONNECT_CTA = 'Disconnect';

export const AUTOMATION_CONNECT_SUCCESS =
  'Connected. DM your shop a quick “how much?” to see it in action.';

export const AUTOMATION_CONNECT_ERROR_FALLBACK =
  'Could not connect. Make sure Instagram is linked to your Facebook Page, then try again.';

/** Labels inside the demo thread. */
export const AUTOMATION_DEMO_CUSTOMER_LABEL = 'Customer';
export const AUTOMATION_DEMO_SHOP_LABEL = 'Your shop';
