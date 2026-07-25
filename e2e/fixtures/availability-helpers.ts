import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/constants/routes';
import type { MinimumNoticeValue } from '../../src/features/availability/types/availability';
import { MINIMUM_NOTICE_OPTIONS } from '../../src/features/availability/types/availability';

function leadTimeLabel(value: MinimumNoticeValue): string {
  const opt = MINIMUM_NOTICE_OPTIONS.find(o => o.value === value);
  if (!opt) throw new Error(`Unknown lead time value: ${value}`);
  return opt.label;
}

/** Opens the owner Availability settings page. */
export async function openAvailabilitySettings(page: Page): Promise<void> {
  await page.goto(ROUTES.DASHBOARD.AVAILABILITY);
  await expect(
    page.getByRole('heading', { name: 'Availability', exact: true })
  ).toBeVisible({ timeout: 20_000 });
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

  const acceptSwitch = page.getByRole('switch', { name: 'Accept Bookings' });
  await expect(acceptSwitch).toBeVisible({ timeout: 15_000 });
  if ((await acceptSwitch.getAttribute('aria-checked')) !== 'true') {
    await acceptSwitch.click();
  }

  const leadSection = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Lead time' }) })
    .filter({ has: page.locator('select') })
    .first();
  const select = leadSection.locator('select');
  await expect(select).toBeEnabled({ timeout: 10_000 });
  await select.selectOption({ label: leadTimeLabel(value) });

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
