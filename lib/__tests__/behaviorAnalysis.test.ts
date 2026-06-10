import { analyzePatterns, computeWeekStats, computeWeekStreak, getLastMondayISO } from '../behaviorAnalysis';
import type { UserActivity, ActivityCompletion, ActivityOverride, CustomCategory } from '@/types';

function makeActivity(partial: Partial<UserActivity>): UserActivity {
  return {
    id: 'a1',
    title: 'Sport',
    cat: 'sport',
    startTime: '09:00',
    endTime: '10:00',
    days: ['Mon'],
    recurrence: 'weekly',
    ...partial,
  };
}

describe('getLastMondayISO', () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    [new Date(2026, 5, 10), '2026-06-08'], // Wednesday → its Monday
    [new Date(2026, 5, 8),  '2026-06-08'], // Monday → itself
    [new Date(2026, 5, 14), '2026-06-08'], // Sunday → previous Monday
  ])('%s → %s', (today, expected) => {
    jest.useFakeTimers();
    jest.setSystemTime(today);
    expect(getLastMondayISO()).toBe(expected);
  });
});

describe('computeWeekStats', () => {
  const weekStart = '2026-06-08'; // Monday

  it('computes completion rate and category hours', () => {
    const activity = makeActivity({ days: ['Mon', 'Wed'], cat: 'travail' }); // 1h, twice
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-08', completed: true },
      { activityId: 'a1', date: '2026-06-10', completed: false },
    ];
    const { completionRate, categoryStats } = computeWeekStats([activity], completions, weekStart);

    expect(completionRate).toBe(0.5); // 1 done out of 2 scheduled
    expect(categoryStats.travail).toEqual({ planned: 2, done: 1 });
  });

  it('counts unmarked occurrences as scheduled but not done', () => {
    const activity = makeActivity({ days: ['Mon'] });
    const { completionRate } = computeWeekStats([activity], [], weekStart);
    expect(completionRate).toBe(0);
  });

  it('buckets custom-category activities separately', () => {
    const cats: CustomCategory[] = [
      { id: 'c1', label: 'Famille', color: { bg: '#FCE7F3', ink: '#9D174D' } },
    ];
    const activity = makeActivity({ customCatId: 'c1', days: ['Mon'] });
    const { categoryStats, customCatStats } = computeWeekStats([activity], [], weekStart, cats);

    expect(categoryStats.sport).toBeUndefined();
    expect(customCatStats.c1).toMatchObject({ label: 'Famille', planned: 1, done: 0 });
  });

  it('ignores completions outside the week', () => {
    const activity = makeActivity({ days: ['Mon'] });
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: true }, // previous week
    ];
    const { completionRate } = computeWeekStats([activity], completions, weekStart);
    expect(completionRate).toBe(0);
  });
});

describe('computeWeekStreak', () => {
  // Today frozen at Wednesday June 10, 2026 → current week starts Monday 06-08,
  // the streak is evaluated from the week of 06-01 backwards
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 10, 12));
  });
  afterEach(() => jest.useRealTimers());

  const weeklyMonday = makeActivity({ days: ['Mon'] });

  it('returns 0 without any completions', () => {
    expect(computeWeekStreak([weeklyMonday], [])).toBe(0);
  });

  it('counts one fully completed past week', () => {
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: true },
    ];
    expect(computeWeekStreak([weeklyMonday], completions)).toBe(1);
  });

  it('counts consecutive completed weeks', () => {
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: true },
      { activityId: 'a1', date: '2026-05-25', completed: true },
      { activityId: 'a1', date: '2026-05-18', completed: true },
    ];
    expect(computeWeekStreak([weeklyMonday], completions)).toBe(3);
  });

  it('breaks at the first week under the threshold', () => {
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: true },
      // 2026-05-25 missing → streak stops even though 05-18 was done
      { activityId: 'a1', date: '2026-05-18', completed: true },
    ];
    expect(computeWeekStreak([weeklyMonday], completions)).toBe(1);
  });

  it('returns 0 when last week failed, regardless of earlier weeks', () => {
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: false },
      { activityId: 'a1', date: '2026-05-25', completed: true },
    ];
    expect(computeWeekStreak([weeklyMonday], completions)).toBe(0);
  });

  it('accepts exactly 80% (4 done out of 5)', () => {
    const weekdaysActivity = makeActivity({ days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] });
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: true },
      { activityId: 'a1', date: '2026-06-02', completed: true },
      { activityId: 'a1', date: '2026-06-03', completed: true },
      { activityId: 'a1', date: '2026-06-04', completed: true },
      { activityId: 'a1', date: '2026-06-05', completed: false }, // 4/5 = 80%
    ];
    expect(computeWeekStreak([weekdaysActivity], completions)).toBe(1);
  });

  it('ignores the in-progress week entirely', () => {
    // Only the current week is completed — past week empty → streak 0
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-08', completed: true },
    ];
    expect(computeWeekStreak([weeklyMonday], completions)).toBe(0);
  });
});

describe('computeWeekStats — recurrence awareness', () => {
  it('does not count one-off activities outside their creation week', () => {
    const oneOff = makeActivity({ recurrence: 'none', anchorDate: '2026-06-01', days: ['Mon'] });
    // Week of June 8: the one-off (anchored June 1) is gone
    const { completionRate } = computeWeekStats([oneOff], [], '2026-06-08');
    expect(completionRate).toBe(0); // nothing scheduled → rate 0, not penalized by a ghost activity
    const stats = computeWeekStats([oneOff], [], '2026-06-01');
    expect(stats.categoryStats.sport).toEqual({ planned: 1, done: 0 }); // counted in its own week
  });
});

describe('analyzePatterns', () => {
  it('flags low completion below 60% with at least 3 data points', () => {
    const activity = makeActivity({});
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: true },
      { activityId: 'a1', date: '2026-06-08', completed: false },
      { activityId: 'a1', date: '2026-06-15', completed: false },
      { activityId: 'a1', date: '2026-06-22', completed: false },
    ];
    const patterns = analyzePatterns([activity], completions, []);
    expect(patterns.some((p) => p.type === 'low_completion')).toBe(true);
  });

  it('stays silent under 3 data points', () => {
    const activity = makeActivity({});
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-08', completed: false },
      { activityId: 'a1', date: '2026-06-15', completed: false },
    ];
    expect(analyzePatterns([activity], completions, [])).toHaveLength(0);
  });

  it('detects a systematically skipped weekday', () => {
    const activity = makeActivity({ days: ['Mon'] });
    // Three Mondays, all skipped
    const completions: ActivityCompletion[] = [
      { activityId: 'a1', date: '2026-06-01', completed: false },
      { activityId: 'a1', date: '2026-06-08', completed: false },
      { activityId: 'a1', date: '2026-06-15', completed: false },
    ];
    const patterns = analyzePatterns([activity], completions, []);
    const daySkip = patterns.find((p) => p.type === 'day_skip');
    expect(daySkip).toBeDefined();
    expect(daySkip!.detail).toContain('lundi');
  });

  it('detects a consistent time drift above 20 minutes', () => {
    const activity = makeActivity({ startTime: '09:00' });
    const overrides: ActivityOverride[] = [
      { activityId: 'a1', date: '2026-06-01', startTime: '09:30' },
      { activityId: 'a1', date: '2026-06-08', startTime: '09:30' },
      { activityId: 'a1', date: '2026-06-15', startTime: '09:30' },
    ];
    const patterns = analyzePatterns([activity], [], overrides);
    const drift = patterns.find((p) => p.type === 'time_drift');
    expect(drift).toBeDefined();
    expect(drift!.suggestion).toContain('09:30');
  });

  it('ignores drifts under 20 minutes', () => {
    const activity = makeActivity({ startTime: '09:00' });
    const overrides: ActivityOverride[] = [
      { activityId: 'a1', date: '2026-06-01', startTime: '09:10' },
      { activityId: 'a1', date: '2026-06-08', startTime: '09:10' },
      { activityId: 'a1', date: '2026-06-15', startTime: '09:10' },
    ];
    expect(analyzePatterns([activity], [], overrides)).toHaveLength(0);
  });

  it('ignores cancelled overrides for drift detection', () => {
    const activity = makeActivity({ startTime: '09:00' });
    const overrides: ActivityOverride[] = [
      { activityId: 'a1', date: '2026-06-01', startTime: '10:00', cancelled: true },
      { activityId: 'a1', date: '2026-06-08', startTime: '10:00', cancelled: true },
      { activityId: 'a1', date: '2026-06-15', startTime: '10:00', cancelled: true },
    ];
    expect(analyzePatterns([activity], [], overrides)).toHaveLength(0);
  });
});
