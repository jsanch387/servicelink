export const SUPPORT_PRESENCE_TIME_ZONE = 'America/Chicago';

export type SupportPresenceState = 'active' | 'recent' | 'away';

export type SupportPresence = {
  state: SupportPresenceState;
  statusLabel: string;
  replyLabel: string;
};

export const SUPPORT_PRESENCE_FALLBACK: SupportPresence = {
  state: 'recent',
  statusLabel: 'Active 2 hours ago',
  replyLabel: "We'll reply by email",
};

const WEEKDAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

function zoneParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SUPPORT_PRESENCE_TIME_ZONE,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);

  const weekday = parts.find(part => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find(part => part.type === 'hour')?.value ?? '0');
  const minute = Number(
    parts.find(part => part.type === 'minute')?.value ?? '0'
  );

  return { weekday, hour, minute };
}

/** Stable 2–7 minute offset so the label does not jump every second. */
function wobbleMinutes(minute: number) {
  return 2 + (Math.floor(minute / 3) % 6);
}

function minutesAgoLabel(minutes: number) {
  return `Active ${minutes}m ago`;
}

function hoursAgoLabel(hours: number) {
  return hours <= 1 ? 'Active 1 hour ago' : `Active ${hours} hours ago`;
}

export function getSupportPresence(now: Date): SupportPresence {
  const { weekday, hour, minute } = zoneParts(now);
  const isWeekday = WEEKDAYS.has(weekday);
  const wobble = wobbleMinutes(minute);
  const afterClose = hour > 17 || (hour === 17 && minute >= 30);

  if (weekday === 'Fri' && afterClose) {
    return {
      state: 'away',
      statusLabel: 'Last seen this afternoon',
      replyLabel: "We'll get back to you Monday",
    };
  }

  if (weekday === 'Sat') {
    return {
      state: 'away',
      statusLabel: hour < 12 ? 'Last seen last night' : 'Last seen yesterday',
      replyLabel: "We'll get back to you Monday",
    };
  }

  if (weekday === 'Sun') {
    return {
      state: 'away',
      statusLabel: 'Last seen yesterday',
      replyLabel: "We'll get back to you Monday",
    };
  }

  if (isWeekday && hour >= 9 && hour < 12) {
    return {
      state: 'active',
      statusLabel: minutesAgoLabel(wobble),
      replyLabel: "We'll get back to you today",
    };
  }

  if (isWeekday && hour === 12) {
    return {
      state: 'recent',
      statusLabel: minutesAgoLabel(8 + (minute % 5)),
      replyLabel: "We'll get back to you this afternoon",
    };
  }

  if (isWeekday && hour >= 13 && !afterClose) {
    return {
      state: 'active',
      statusLabel: minutesAgoLabel(wobble),
      replyLabel: "We'll get back to you today",
    };
  }

  if (isWeekday && hour >= 17 && hour < 20) {
    return {
      state: 'recent',
      statusLabel: hoursAgoLabel(hour - 16),
      replyLabel: "We'll email you back tonight or first thing tomorrow",
    };
  }

  if (isWeekday && hour >= 20) {
    return {
      state: 'away',
      statusLabel: hoursAgoLabel(hour - 17),
      replyLabel: "We'll get back to you tomorrow",
    };
  }

  return {
    state: 'away',
    statusLabel: hour < 6 ? 'Last seen last night' : 'Last seen 8h ago',
    replyLabel: "We'll get back to you this morning",
  };
}
