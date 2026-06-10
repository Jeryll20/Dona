import { getCyclePhase, getCycleStatus, toISODate } from '../cycle';

// Freeze "today" at Wednesday June 10, 2026, noon local time
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 5, 10, 12, 0, 0));
});
afterAll(() => jest.useRealTimers());

describe('getCyclePhase — phase boundaries (28-day cycle)', () => {
  it.each([
    ['2026-06-10', 'menstrual'],  // day 0
    ['2026-06-05', 'menstrual'],  // day 5 (boundary)
    ['2026-06-04', 'follicular'], // day 6
    ['2026-05-28', 'follicular'], // day 13 (boundary)
    ['2026-05-27', 'ovulation'],  // day 14
    ['2026-05-25', 'ovulation'],  // day 16 (boundary)
    ['2026-05-24', 'luteal'],     // day 17
    ['2026-05-14', 'luteal'],     // day 27
  ])('last period %s → %s', (lastPeriod, expected) => {
    expect(getCyclePhase(lastPeriod, 28)).toBe(expected);
  });

  it('wraps around after a full cycle', () => {
    // 28 days ago → elapsed 28 % 28 = 0 → menstrual again
    expect(getCyclePhase('2026-05-13', 28)).toBe('menstrual');
  });

  it('treats a (mistaken) future date as day 1 instead of breaking', () => {
    expect(getCyclePhase('2026-06-20', 28)).toBe('menstrual');
  });
});

describe('getCycleStatus', () => {
  it('computes day in cycle and days until next period', () => {
    const status = getCycleStatus('2026-06-01', 28); // 9 days ago
    expect(status.dayInCycle).toBe(10);
    expect(status.phase).toBe('follicular');
    expect(status.daysUntilPeriod).toBe(19); // 28 - 9
  });
});

describe('toISODate', () => {
  it('uses local date parts (no UTC previous-day shift)', () => {
    expect(toISODate(new Date(2026, 5, 8, 0, 0))).toBe('2026-06-08');
  });
});
