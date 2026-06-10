import { parseLocalDate, toLocalISODate, isActivityVisibleOn } from '../recurrence';
import type { UserActivity } from '@/types';

function makeActivity(partial: Partial<UserActivity>): UserActivity {
  return {
    id: 'a1',
    title: 'Test',
    cat: 'activite',
    startTime: '09:00',
    endTime: '10:00',
    days: ['Mon'],
    recurrence: 'weekly',
    ...partial,
  };
}

describe('local date helpers', () => {
  it('formats a Date as local YYYY-MM-DD without UTC shift', () => {
    // Local midnight — toISOString() would return the previous day in UTC+ timezones
    expect(toLocalISODate(new Date(2026, 5, 8, 0, 0))).toBe('2026-06-08');
    expect(toLocalISODate(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
  });

  it('parses YYYY-MM-DD as a local date (weekday preserved)', () => {
    const d = parseLocalDate('2026-06-08');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5);
    expect(d.getDate()).toBe(8);
    expect(d.getDay()).toBe(1); // Monday
  });

  it('round-trips parse → format', () => {
    expect(toLocalISODate(parseLocalDate('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('isActivityVisibleOn — weekday filter', () => {
  it('hides an activity on a day not in its days list', () => {
    const a = makeActivity({ days: ['Mon'], recurrence: 'weekly' });
    expect(isActivityVisibleOn(a, '2026-06-08')).toBe(true);  // Monday
    expect(isActivityVisibleOn(a, '2026-06-09')).toBe(false); // Tuesday
  });
});

describe('isActivityVisibleOn — weekly', () => {
  it('shows every week regardless of anchor', () => {
    const a = makeActivity({ recurrence: 'weekly', anchorDate: '2026-06-08' });
    expect(isActivityVisibleOn(a, '2026-06-08')).toBe(true);
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(true);
    expect(isActivityVisibleOn(a, '2026-06-22')).toBe(true);
  });
});

describe('isActivityVisibleOn — one-off (none)', () => {
  it('shows only during the 7 days starting at creation', () => {
    const a = makeActivity({ recurrence: 'none', anchorDate: '2026-06-08' });
    expect(isActivityVisibleOn(a, '2026-06-08')).toBe(true);  // anchor Monday
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(false); // next Monday
    expect(isActivityVisibleOn(a, '2026-06-01')).toBe(false); // before anchor
  });

  it('covers the next matching day when created mid-week', () => {
    // Created Wednesday for a Monday activity → next Monday (5 days later) counts
    const a = makeActivity({ recurrence: 'none', anchorDate: '2026-06-10', days: ['Mon'] });
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(true);
    expect(isActivityVisibleOn(a, '2026-06-22')).toBe(false);
  });

  it('legacy one-off without anchorDate stays visible (backward compat)', () => {
    const a = makeActivity({ recurrence: 'none', anchorDate: undefined });
    expect(isActivityVisibleOn(a, '2026-06-08')).toBe(true);
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(true);
  });
});

describe('isActivityVisibleOn — N-weekly', () => {
  it('biweekly shows on anchor week, hides +1, shows +2', () => {
    const a = makeActivity({ recurrence: 'biweekly', anchorDate: '2026-06-08' });
    expect(isActivityVisibleOn(a, '2026-06-08')).toBe(true);
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(false);
    expect(isActivityVisibleOn(a, '2026-06-22')).toBe(true);
  });

  it('triweekly repeats every 3 weeks', () => {
    const a = makeActivity({ recurrence: 'triweekly', anchorDate: '2026-06-08' });
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(false);
    expect(isActivityVisibleOn(a, '2026-06-22')).toBe(false);
    expect(isActivityVisibleOn(a, '2026-06-29')).toBe(true);
  });

  it('anchors to the week (Monday), not the exact creation day', () => {
    // Anchored Wednesday June 10 → its week starts Monday June 8
    const a = makeActivity({ recurrence: 'biweekly', anchorDate: '2026-06-10' });
    expect(isActivityVisibleOn(a, '2026-06-15')).toBe(false); // week +1
    expect(isActivityVisibleOn(a, '2026-06-22')).toBe(true);  // week +2
  });

  it('hides weeks before the anchor', () => {
    const a = makeActivity({ recurrence: 'biweekly', anchorDate: '2026-06-08' });
    expect(isActivityVisibleOn(a, '2026-05-25')).toBe(false);
  });
});
