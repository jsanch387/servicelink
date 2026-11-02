import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/constants/routes';
import type {
  BufferTimeValue,
  MinimumNoticeValue,
} from '../../src/features/availability/types/availability';
import {
  BUFFER_TIME_OPTIONS,
  MINIMUM_NOTICE_OPTIONS,
} from '../../src/features/availability/types/availability';

function leadTimeLabel(value: MinimumNoticeValue): string {
  const opt = MINIMUM_NOTICE_OPTIONS.find(o => o.value === value);
  if (!opt) throw new Error(`Unknown lead time value: ${value}`);
  return opt.label;
}

function bufferTimeLabel(value: BufferTimeValue): string {
  const opt = BUFFER_TIME_OPTIONS.find(o => o.value === value);
  if (!opt) throw new Error(`Unknown buffer time value: ${value}`);
  return opt.label;
}

/** Opens the owner Availability settings page. */
export async function openAvailabilitySettings(page: Page): Promise<void> {
  await page.goto(ROUTES.DASHBOARD.AVAILABILITY);
  await expect(page.getByRole('tab', { name: 'Your schedule' })).toBeVisible({
    timeout: 20_000,
  });
}

/** Time off, lead time, and buffer live on the Settings tab. */
export async function openAvailabilityBookingRules(page: Page): Promise<void> {
  const tab = page.getByRole('tab', { name: 'Settings' });
  await expect(tab).toBeVisible({ timeout: 10_000 });
  await tab.click();
}

/**
 * Sets lead time in the Availability UI and saves.
 * Ensures Accept Bookings is on so the lead-time control is usable.
 */
export async function setLeadTimeViaUi(
  page: Page,
  value: MinimumNoticeValue
): Promise<void> {
  await openAvailabilitySettings(page);
  await openAvailabilityBookingRules(page);

  const acceptSwitch = page.getByRole('switch', { name: 'Accept Bookings' });
  await expect(acceptSwitch).toBeVisible({ timeout: 15_000 });
  if ((await acceptSwitch.getAttribute('aria-checked')) !== 'true') {
    await acceptSwitch.click();
  }

  const select = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Lead time' }) })
    .getByRole('combobox');
  await expect(select).toBeEnabled({ timeout: 10_000 });
  await select.selectOption({ label: leadTimeLabel(value) });

  const save = page.getByRole('button', { name: 'Save availability' });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText('Availability saved')).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Sets buffer time in the Availability UI and saves.
 * Ensures Accept Bookings is on so the buffer-time control is usable.
 */
export async function setBufferTimeViaUi(
  page: Page,
  value: BufferTimeValue
): Promise<void> {
  await openAvailabilitySettings(page);
  await openAvailabilityBookingRules(page);

  const acceptSwitch = page.getByRole('switch', { name: 'Accept Bookings' });
  await expect(acceptSwitch).toBeVisible({ timeout: 15_000 });
  if ((await acceptSwitch.getAttribute('aria-checked')) !== 'true') {
    await acceptSwitch.click();
  }

  const select = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Buffer time' }) })
    .getByRole('combobox');
  await expect(select).toBeEnabled({ timeout: 10_000 });
  await select.selectOption({ label: bufferTimeLabel(value) });

  const save = page.getByRole('button', { name: 'Save availability' });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText('Availability saved')).toBeVisible({
    timeout: 15_000,
  });
}

export interface TimeOffBlockApiInput {
  id: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime: string;
  endTime: string;
  title?: string;
}

interface AvailabilityApiRow {
  accept_bookings: boolean;
  minimum_notice: string;
  buffer_time?: string;
  weekly_schedule: unknown;
  selected_preset: string;
  time_off_blocks?: Array<{
    id: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    startDate?: string;
    endDate?: string;
    all_day?: boolean;
    allDay?: boolean;
    start_time?: string;
    end_time?: string;
    startTime?: string;
    endTime?: string;
    title?: string;
  }> | null;
}

function mapStoredTimeOffToApiPayload(
  blocks: NonNullable<AvailabilityApiRow['time_off_blocks']>
): TimeOffBlockApiInput[] {
  return blocks.map(b => {
    const startDate = b.start_date ?? b.startDate ?? b.date ?? '';
    const endDate = b.end_date ?? b.endDate ?? startDate;
    const startTime = b.startTime ?? b.start_time ?? '00:00';
    const endTime = b.endTime ?? b.end_time ?? '23:59';
    const allDay =
      typeof b.all_day === 'boolean'
        ? b.all_day
        : typeof b.allDay === 'boolean'
          ? b.allDay
          : startTime === '00:00' && endTime === '23:59';
    return {
      id: b.id,
      startDate,
      endDate,
      allDay,
      startTime,
      endTime,
      title: b.title ?? '',
    };
  });
}

/** Loads the owner availability row (auth cookies from `page`). */
export async function fetchAvailabilityRow(
  page: Page
): Promise<AvailabilityApiRow | null> {
  const res = await page.request.get('/api/availability');
  if (!res.ok()) {
    throw new Error(
      `GET /api/availability failed (${res.status()}): ${await res.text()}`
    );
  }
  const json = (await res.json()) as {
    success?: boolean;
    data?: AvailabilityApiRow | null;
  };
  return json.data ?? null;
}

async function postAvailabilityOverrides(
  page: Page,
  overrides: {
    minimumNotice?: string;
    bufferTime?: string;
    timeOffBlocks?: TimeOffBlockApiInput[];
  }
): Promise<void> {
  const row = await fetchAvailabilityRow(page);
  if (!row) {
    throw new Error('No availability row to update');
  }

  const timeOffBlocks =
    overrides.timeOffBlocks ??
    mapStoredTimeOffToApiPayload(row.time_off_blocks ?? []);

  const res = await page.request.post('/api/availability', {
    data: {
      acceptBookings: row.accept_bookings,
      schedule: row.weekly_schedule,
      minimumNotice: overrides.minimumNotice ?? row.minimum_notice,
      bufferTime: overrides.bufferTime ?? row.buffer_time ?? 'none',
      selectedPreset: row.selected_preset,
      timeOffBlocks,
    },
  });
  if (!res.ok()) {
    throw new Error(
      `Failed to update availability (${res.status()}): ${await res.text()}`
    );
  }
}

/**
 * Restores `minimum_notice` via API without touching the rest of the UI state
 * more than necessary (uses current GET row + override).
 */
export async function restoreMinimumNoticeViaApi(
  page: Page,
  minimumNotice: string
): Promise<void> {
  await postAvailabilityOverrides(page, { minimumNotice });
}

/** Restores `buffer_time` via API (preserves schedule + lead time + time off). */
export async function restoreBufferTimeViaApi(
  page: Page,
  bufferTime: string
): Promise<void> {
  await postAvailabilityOverrides(page, { bufferTime });
}

/** Replaces `time_off_blocks` via API (preserves schedule + lead time). */
export async function setTimeOffBlocksViaApi(
  page: Page,
  timeOffBlocks: TimeOffBlockApiInput[]
): Promise<void> {
  await postAvailabilityOverrides(page, { timeOffBlocks });
}

/** Restores previously saved time-off blocks via API. */
export async function restoreTimeOffBlocksViaApi(
  page: Page,
  timeOffBlocks: TimeOffBlockApiInput[]
): Promise<void> {
  await setTimeOffBlocksViaApi(page, timeOffBlocks);
}

/**
 * Snapshot current time-off blocks in the camelCase POST shape.
 */
export async function snapshotTimeOffBlocksViaApi(
  page: Page
): Promise<TimeOffBlockApiInput[]> {
  const row = await fetchAvailabilityRow(page);
  if (!row) {
    throw new Error('No availability row to snapshot');
  }
  return mapStoredTimeOffToApiPayload(row.time_off_blocks ?? []);
}

/** Local YYYY-MM-DD for a Date. */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Next calendar day (local) whose weekday is enabled in the weekly schedule.
 * Skips today so lead time / past slots don't interfere.
 */
export function findNextOpenDayYmd(
  weeklySchedule:
    | Record<string, { enabled?: boolean } | undefined>
    | null
    | undefined,
  from: Date = new Date()
): { ymd: string; dayOfMonth: number; date: Date } {
  const dayKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ] as const;

  for (let offset = 1; offset <= 21; offset += 1) {
    const candidate = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offset
    );
    const key = dayKeys[candidate.getDay()];
    if (weeklySchedule?.[key]?.enabled) {
      return {
        ymd: toLocalYmd(candidate),
        dayOfMonth: candidate.getDate(),
        date: candidate,
      };
    }
  }

  throw new Error('No open day found in the next 3 weeks of weekly_schedule');
}

/** Calendar day cell for the given day-of-month in the visible month grid. */
export function calendarDayButton(page: Page, dayOfMonth: number) {
  return page
    .locator('button')
    .filter({ hasText: new RegExp(`^${dayOfMonth}$`) })
    .first();
}

function parseTimeHHmm(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toHHmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Public TimeSlotGrid label: `9 AM`, `10:30 AM`. */
export function publicTimeSlotButton(page: Page, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = h ?? 0;
  const minute = m ?? 0;
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const pattern =
    minute === 0
      ? new RegExp(`^${h12}(:00)?\\s?${ampm}$`, 'i')
      : new RegExp(
          `^${h12}:${String(minute).padStart(2, '0')}\\s?${ampm}$`,
          'i'
        );
  return page.getByRole('button', { name: pattern });
}

export type WeeklyDaySchedule = {
  enabled?: boolean;
  start?: string;
  end?: string;
};

/**
 * Next enabled weekday that can hold a 9:00 (or day-open) 60-minute seed
 * booking plus a 1-hour buffer and a following slot.
 */
export function findNextOpenDayForBufferSeed(
  weeklySchedule:
    | Record<string, WeeklyDaySchedule | undefined>
    | null
    | undefined,
  from: Date = new Date()
): {
  ymd: string;
  dayOfMonth: number;
  date: Date;
  seedStart: string;
} {
  const dayKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ] as const;
  const preferredStart = parseTimeHHmm('09:00');
  const seedDuration = 60;
  const roomAfterSeed = 60 + 120;

  for (let offset = 1; offset <= 21; offset += 1) {
    const candidate = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + offset
    );
    const key = dayKeys[candidate.getDay()];
    const day = weeklySchedule?.[key];
    if (!day?.enabled) continue;

    const windowStart = parseTimeHHmm(day.start ?? '09:00');
    const windowEnd = parseTimeHHmm(day.end ?? '17:00');
    const seedStartMins =
      windowStart <= preferredStart &&
      preferredStart + seedDuration + roomAfterSeed <= windowEnd
        ? preferredStart
        : windowStart;

    if (seedStartMins + seedDuration + roomAfterSeed > windowEnd) continue;

    return {
      ymd: toLocalYmd(candidate),
      dayOfMonth: candidate.getDate(),
      date: candidate,
      seedStart: toHHmm(seedStartMins),
    };
  }

  throw new Error(
    'No open day with enough hours for a 9:00 (or open) seed booking plus buffer'
  );
}

export type PublicBlockedSlot = {
  date: string;
  startTime: string;
  durationMinutes: number;
};

function parseLocalYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/**
 * Reuse a confirmed booking as the buffer seed so the test does not
 * increment the free-tier lifetime booking cap.
 */
export function findExistingBufferSeed(
  blocked: ReadonlyArray<PublicBlockedSlot>,
  weeklySchedule:
    | Record<string, WeeklyDaySchedule | undefined>
    | null
    | undefined,
  from: Date = new Date()
): {
  ymd: string;
  dayOfMonth: number;
  date: Date;
  seedStart: string;
  durationMinutes: number;
} | null {
  const dayKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ] as const;
  const todayYmd = toLocalYmd(from);
  const roomAfterSeed = 120;

  const sorted = [...blocked].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return String(a.startTime).localeCompare(String(b.startTime));
  });

  for (const slot of sorted) {
    if (slot.date <= todayYmd) continue;
    const durationMinutes = Math.max(1, slot.durationMinutes);
    const seedStart = String(slot.startTime ?? '').slice(0, 5);
    if (!/^\d{2}:\d{2}$/.test(seedStart)) continue;

    const date = parseLocalYmd(slot.date);
    const key = dayKeys[date.getDay()];
    const day = weeklySchedule?.[key];
    if (!day?.enabled) continue;

    const windowEnd = parseTimeHHmm(day.end ?? '17:00');
    const start = parseTimeHHmm(seedStart);
    if (start + durationMinutes + roomAfterSeed > windowEnd) continue;

    const inspectStart = start + durationMinutes;
    const inspectEnd = inspectStart + roomAfterSeed;
    const collision = blocked.some(other => {
      if (other.date !== slot.date) return false;
      const otherStart = parseTimeHHmm(
        String(other.startTime ?? '').slice(0, 5)
      );
      if (otherStart === start && other.durationMinutes === durationMinutes) {
        return false;
      }
      const otherEnd = otherStart + Math.max(1, other.durationMinutes);
      return otherStart < inspectEnd && otherEnd > inspectStart;
    });
    if (collision) continue;

    return {
      ymd: slot.date,
      dayOfMonth: date.getDate(),
      date,
      seedStart,
      durationMinutes,
    };
  }

  return null;
}

/** Confirmed/completed bookings used to block public slots. */
export async function fetchPublicBlockedSlots(
  page: Page,
  slug: string
): Promise<PublicBlockedSlot[]> {
  const res = await page.request.get(
    `/api/public/bookings/blocked/${encodeURIComponent(slug)}`
  );
  if (!res.ok()) {
    throw new Error(
      `GET blocked slots failed (${res.status()}): ${await res.text()}`
    );
  }
  const json = (await res.json()) as {
    success?: boolean;
    blockedSlots?: PublicBlockedSlot[];
  };
  return json.blockedSlots ?? [];
}

/** True when another booking overlaps `[start, start + duration + clearAfter)`. */
export function morningWindowIsOccupied(
  blocked: ReadonlyArray<PublicBlockedSlot>,
  ymd: string,
  startHHmm: string,
  durationMinutes: number,
  clearAfterMinutes: number
): boolean {
  const start = parseTimeHHmm(startHHmm);
  const end = start + durationMinutes + clearAfterMinutes;
  return blocked.some(b => {
    if (b.date !== ymd) return false;
    const bStart = parseTimeHHmm(String(b.startTime ?? '').slice(0, 5));
    const bEnd = bStart + Math.max(1, b.durationMinutes);
    return start < bEnd && end > bStart;
  });
}
