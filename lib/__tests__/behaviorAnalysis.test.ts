import { analyzePatterns, computeWeekStats, getLastMondayISO } from '../behaviorAnalysis';
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
