import { generateWeekPlan, getPlanningWeekStart, type PlannerInput } from '../planner';
import type { UserActivity } from '@/types';

const WEEK = '2026-06-08'; // Monday

function makeSport(partial: Partial<UserActivity> = {}): UserActivity {
  return {
    id: 'sport1',
    title: 'Course à pied',
    cat: 'sport',
    startTime: '18:00',
    endTime: '19:00',
    days: ['Tue'],
    recurrence: 'weekly',
    weeklyGoal: 3,
    ...partial,
  };
}

function baseInput(partial: Partial<PlannerInput> = {}): PlannerInput {
  return {
    goal: undefined,
    activities: [],
    completions: [],
    sleep: { bedtime: '23:00', waketime: '07:00', prepMinutes: 30 },
    meals: { entries: [{ time: '12:30', label: 'Déjeuner' }, { time: '19:30', label: 'Dîner' }] },
    weekStart: WEEK,
    ...partial,
  };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

describe('generateWeekPlan — structure', () => {
  it('caps the number of proposals', () => {
    const { proposals: plan } = generateWeekPlan(baseInput({
      goal: 'routine',
      activities: [makeSport({ weeklyGoal: 7 })],
    }));
    expect(plan.length).toBeLessThanOrEqual(6);
  });

  it('keeps proposals within waking hours and inside the target week', () => {
    const { proposals: plan } = generateWeekPlan(baseInput({ goal: 'routine', activities: [makeSport()] }));
    for (const p of plan) {
      expect(p.date >= '2026-06-08' && p.date <= '2026-06-14').toBe(true);
      expect(toMinutes(p.startTime)).toBeGreaterThanOrEqual(7 * 60);
      expect(toMinutes(p.endTime)).toBeLessThanOrEqual(23 * 60);
      expect(toMinutes(p.endTime)).toBeGreaterThan(toMinutes(p.startTime));
    }
  });

  it('proposals never overlap each other on the same day', () => {
    const { proposals: plan } = generateWeekPlan(baseInput({
      goal: 'routine',
      activities: [makeSport({ weeklyGoal: 5 })],
    }));
    for (const a of plan) {
      for (const b of plan) {
        if (a.id === b.id || a.date !== b.date) continue;
        const overlap = toMinutes(a.startTime) < toMinutes(b.endTime)
                     && toMinutes(b.startTime) < toMinutes(a.endTime);
        expect(overlap).toBe(false);
      }
    }
  });
});

describe('generateWeekPlan — sport weekly goal', () => {
  it('proposes the missing sessions to reach the goal', () => {
    // Goal 3, already scheduled Tuesday → 2 extra sessions proposed
    const { proposals: plan } = generateWeekPlan(baseInput({ activities: [makeSport({ weeklyGoal: 3 })] }));
    const sportProps = plan.filter((p) => p.cat === 'sport');
    expect(sportProps).toHaveLength(2);
    // Never on the day the sport already happens
    expect(sportProps.some((p) => p.weekDay === 'Tue')).toBe(false);
  });

  it('does not duplicate sport sessions when the goal is already covered', () => {
    const sport = makeSport({ days: ['Mon', 'Wed', 'Fri'], weeklyGoal: 3 });
    const { proposals: plan } = generateWeekPlan(baseInput({ activities: [sport] }));
    expect(plan.filter((p) => p.title === 'Course à pied')).toHaveLength(0);
  });
});

describe('generateWeekPlan — fallback', () => {
  it('never returns empty when free slots exist', () => {
    // No sport goal, no cycle, no onboarding goal — the three rules produce
    // nothing, the fallback must still propose something
    const { proposals } = generateWeekPlan(baseInput({}));
    expect(proposals.length).toBeGreaterThan(0);
    expect(proposals.length).toBeLessThanOrEqual(3);
    // Spread over distinct days
    const dates = proposals.map((p) => p.date);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('does not kick in when real rules already produced proposals', () => {
    const { proposals } = generateWeekPlan(baseInput({ activities: [makeSport({ weeklyGoal: 3 })] }));
    expect(proposals.some((p) => p.title === 'Temps pour toi')).toBe(false);
  });
});

describe('generateWeekPlan — cycle adaptation', () => {
  // lastPeriodDate 2026-06-10 (Wednesday of the target week):
  // Mon 06-08 / Tue 06-09 → luteal (end of previous cycle)
  // Wed 06-10 → day 0 … Mon 06-15 → menstrual
  const cycle = { tracking: true, lastPeriodDate: '2026-06-10', cycleDays: 28 };

  it('schedules hard sessions on high-energy days and gentle ones during menstruation', () => {
    const { proposals: plan } = generateWeekPlan(baseInput({
      activities: [makeSport({ weeklyGoal: 3 })],
      cycle,
    }));
    const sportProps = plan.filter((p) => p.cat === 'sport');
    expect(sportProps.length).toBeGreaterThan(0);
    for (const p of sportProps) {
      // Menstrual days (06-10 → 06-14 within this week) only get the gentle variant
      if (p.date >= '2026-06-10') {
        expect(p.title).toBe('Yoga doux ou marche');
      } else {
        expect(p.title).toBe('Course à pied');
      }
    }
  });

  it('adds a wellness break during the menstrual phase', () => {
    const { proposals: plan } = generateWeekPlan(baseInput({ cycle }));
    expect(plan.some((p) => p.title === 'Pause bien-être')).toBe(true);
  });

  it('mentions the phase in the reasons', () => {
    const { proposals: plan } = generateWeekPlan(baseInput({
      activities: [makeSport({ weeklyGoal: 2 })],
      cycle,
    }));
    expect(plan.some((p) => p.reason.includes('phase'))).toBe(true);
  });

  it('proposes a lowered sport goal on menstrual-heavy weeks (with explanation)', () => {
    // Period starts Wednesday 06-10 → 5 menstrual days in the target week
    const { adjustments } = generateWeekPlan(baseInput({
      activities: [makeSport({ weeklyGoal: 3 })],
      cycle,
    }));
    expect(adjustments).toHaveLength(1);
    expect(adjustments[0]).toMatchObject({ activityTitle: 'Course à pied', originalGoal: 3, adjustedGoal: 2 });
    expect(adjustments[0].reason).toContain('menstruelle');
  });

  it('never adjusts below 1 session, and never without cycle tracking', () => {
    const lowGoal = generateWeekPlan(baseInput({
      activities: [makeSport({ weeklyGoal: 1 })],
      cycle,
    }));
    expect(lowGoal.adjustments).toHaveLength(0);

    const noCycle = generateWeekPlan(baseInput({ activities: [makeSport({ weeklyGoal: 3 })] }));
    expect(noCycle.adjustments).toHaveLength(0);
  });

  it('does not adjust when the week has no menstrual days', () => {
    // lastPeriod 2026-06-01 → the target week spans days 7–13 = follicular only
    const { adjustments } = generateWeekPlan(baseInput({
      activities: [makeSport({ weeklyGoal: 3 })],
      cycle: { tracking: true, lastPeriodDate: '2026-06-01', cycleDays: 28 },
    }));
    expect(adjustments).toHaveLength(0);
  });
});

describe('generateWeekPlan — onboarding goal', () => {
  it("'routine' proposes recurring anchors", () => {
    const { proposals: plan } = generateWeekPlan(baseInput({ goal: 'routine' }));
    const recurring = plan.filter((p) => p.recurring);
    expect(recurring.length).toBeGreaterThanOrEqual(1);
  });

  it("'organise' proposes a weekly prep slot", () => {
    const { proposals: plan } = generateWeekPlan(baseInput({ goal: 'organise' }));
    expect(plan.some((p) => p.title === 'Préparer ma semaine')).toBe(true);
  });

  it("'activite' proposes a discovery session", () => {
    const { proposals: plan } = generateWeekPlan(baseInput({ goal: 'activite' }));
    expect(plan.some((p) => p.title === 'Nouvelle activité à essayer')).toBe(true);
  });
});

describe('getPlanningWeekStart', () => {
  afterEach(() => jest.useRealTimers());

  it.each([
    [new Date(2026, 5, 10), '2026-06-08'], // Wednesday → current week
    [new Date(2026, 5, 12), '2026-06-15'], // Friday → next week
    [new Date(2026, 5, 14), '2026-06-15'], // Sunday → next week
  ])('%s → %s', (today, expected) => {
    jest.useFakeTimers();
    jest.setSystemTime(today);
    expect(getPlanningWeekStart()).toBe(expected);
  });
});
