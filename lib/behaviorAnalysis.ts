import { isActivityVisibleOn } from './recurrence';
import type {
  ActivityCompletion,
  ActivityOverride,
  UserActivity,
  CustomCategory,
  PatternInsight,
  CategoryStat,
  CustomCatStat,
  CatKey,
  WeekDay,
} from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const LOW_COMPLETION_THRESHOLD = 0.6;  // < 60% → flagged
const MIN_OCCURRENCES          = 3;    // need at least 3 data points
const TIME_DRIFT_MINUTES       = 20;   // > 20 min consistent drift

const WEEKDAY_LABELS: Record<WeekDay, string> = {
  Mon: 'lundi', Tue: 'mardi', Wed: 'mercredi', Thu: 'jeudi',
  Fri: 'vendredi', Sat: 'samedi', Sun: 'dimanche',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDecimalHours(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

// Parse "YYYY-MM-DD" as a LOCAL date — new Date(str) would parse it as UTC
// midnight, shifting the weekday in non-UTC timezones.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format a Date as local "YYYY-MM-DD" — toISOString() converts to UTC and
// can return the previous day (e.g. French midnight = 22:00/23:00 UTC).
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayOfWeek(dateStr: string): WeekDay {
  const js = parseLocalDate(dateStr).getDay(); // 0=Sun
  const map: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[js];
}

function durationHours(startTime: string, endTime: string): number {
  const s = toDecimalHours(startTime);
  let e   = toDecimalHours(endTime);
  if (e < s) e += 24; // overnight
  return e - s;
}

// ── Pattern detectors ─────────────────────────────────────────────────────────

function detectLowCompletion(
  activity: UserActivity,
  completions: ActivityCompletion[],
): PatternInsight | null {
  const mine = completions.filter((c) => c.activityId === activity.id);
  if (mine.length < MIN_OCCURRENCES) return null;

  const rate = mine.filter((c) => c.completed).length / mine.length;
  if (rate >= LOW_COMPLETION_THRESHOLD) return null;

  const pct = Math.round(rate * 100);
  return {
    activityId:    activity.id,
    activityTitle: activity.title,
    type:          'low_completion',
    detail:        `Tu réalises "${activity.title}" seulement ${pct}% du temps.`,
    suggestion:    `Veux-tu alléger la fréquence ou déplacer cette activité à un meilleur moment ?`,
  };
}

function detectDaySkip(
  activity: UserActivity,
  completions: ActivityCompletion[],
): PatternInsight | null {
  const mine = completions.filter((c) => c.activityId === activity.id && !c.completed);
  if (mine.length < MIN_OCCURRENCES) return null;

  // Count skips per weekday
  const skipsByDay: Partial<Record<WeekDay, number>> = {};
  for (const c of mine) {
    const d = dayOfWeek(c.date);
    skipsByDay[d] = (skipsByDay[d] ?? 0) + 1;
  }

  // Find a day where all (or almost all) occurrences are skipped
  for (const [day, count] of Object.entries(skipsByDay) as [WeekDay, number][]) {
    if (!activity.days.includes(day)) continue;
    const total = completions.filter(
      (c) => c.activityId === activity.id && dayOfWeek(c.date) === day,
    ).length;
    if (total < 2) continue;
    if (count / total >= 0.8) {
      return {
        activityId:    activity.id,
        activityTitle: activity.title,
        type:          'day_skip',
        detail:        `Tu sautes presque toujours "${activity.title}" le ${WEEKDAY_LABELS[day]}.`,
        suggestion:    `Supprimer le ${WEEKDAY_LABELS[day]} de cette activité ou la déplacer à un autre jour ?`,
      };
    }
  }

  return null;
}

function detectTimeDrift(
  activity: UserActivity,
  overrides: ActivityOverride[],
): PatternInsight | null {
  const mine = overrides.filter(
    (o) => o.activityId === activity.id && o.startTime && !o.cancelled,
  );
  if (mine.length < MIN_OCCURRENCES) return null;

  const scheduled = toDecimalHours(activity.startTime);
  const drifts    = mine.map((o) => toDecimalHours(o.startTime!) - scheduled);
  const avg       = drifts.reduce((a, b) => a + b, 0) / drifts.length;
  const avgMins   = Math.round(avg * 60);

  if (Math.abs(avgMins) < TIME_DRIFT_MINUTES) return null;

  const dir  = avgMins > 0 ? 'plus tard' : 'plus tôt';
  const absMins = Math.abs(avgMins);
  const newH = scheduled + avg;
  const newHH = `${String(Math.floor(newH) % 24).padStart(2, '0')}:${String(Math.round((newH % 1) * 60)).padStart(2, '0')}`;

  return {
    activityId:    activity.id,
    activityTitle: activity.title,
    type:          'time_drift',
    detail:        `Tu commences "${activity.title}" en moyenne ${absMins} min ${dir} que prévu.`,
    suggestion:    `Décaler l'heure de début à ${newHH} pour coller à tes habitudes réelles ?`,
  };
}

// ── Main analysis entry point ─────────────────────────────────────────────────

export function analyzePatterns(
  activities:  UserActivity[],
  completions: ActivityCompletion[],
  overrides:   ActivityOverride[],
): PatternInsight[] {
  const insights: PatternInsight[] = [];

  for (const activity of activities) {
    const lc = detectLowCompletion(activity, completions);
    if (lc) insights.push(lc);

    const ds = detectDaySkip(activity, completions);
    if (ds) insights.push(ds);

    const td = detectTimeDrift(activity, overrides);
    if (td) insights.push(td);
  }

  return insights;
}

// ── Weekly stats computation ──────────────────────────────────────────────────

export function computeWeekStats(
  activities:       UserActivity[],
  completions:      ActivityCompletion[],
  weekStart:        string,  // "YYYY-MM-DD" Monday
  customCategories: CustomCategory[] = [],
): {
  completionRate:  number;
  categoryStats:   Partial<Record<CatKey, CategoryStat>>;
  customCatStats:  Record<string, CustomCatStat>;
} {
  // Build the 7 dates of the week (local — no UTC conversion)
  const dates: string[] = [];
  const base = parseLocalDate(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    dates.push(toLocalISODate(d));
  }

  let totalScheduled = 0;
  let totalDone      = 0;
  const catStats: Partial<Record<CatKey, CategoryStat>> = {};
  const customCatStats: Record<string, CustomCatStat>   = {};

  for (const date of dates) {
    // Recurrence-aware: one-off activities only count during their creation
    // week, N-weekly only on their active weeks (legacy data: weekly behavior)
    const dayActivities = activities.filter((a) => isActivityVisibleOn(a, date));

    for (const act of dayActivities) {
      const dur  = durationHours(act.startTime, act.endTime);
      const comp = completions.find((c) => c.activityId === act.id && c.date === date);
      const done = comp?.completed ? dur : 0;
      totalScheduled++;
      if (comp?.completed) totalDone++;

      if (act.customCatId) {
        // Bucket into custom category stats
        const cc = customCategories.find((c) => c.id === act.customCatId);
        if (cc) {
          const entry = customCatStats[act.customCatId] ?? { label: cc.label, color: cc.color, planned: 0, done: 0 };
          entry.planned += dur;
          entry.done    += done;
          customCatStats[act.customCatId] = entry;
        }
      } else {
        // Bucket into built-in category stats
        const entry = catStats[act.cat] ?? { planned: 0, done: 0 };
        entry.planned += dur;
        entry.done    += done;
        catStats[act.cat] = entry;
      }
    }
  }

  const completionRate = totalScheduled > 0 ? totalDone / totalScheduled : 0;
  return { completionRate, categoryStats: catStats, customCatStats };
}

// ── Weekly streak ─────────────────────────────────────────────────────────────

export const STREAK_THRESHOLD = 0.8;
const STREAK_MAX_WEEKS = 52;

/**
 * Number of consecutive FULLY ELAPSED weeks (ending last week) whose
 * completion rate is ≥ 80%. The in-progress week never counts — its unmarked
 * future occurrences would unfairly deflate the rate.
 */
export function computeWeekStreak(
  activities:  UserActivity[],
  completions: ActivityCompletion[],
): number {
  let streak = 0;
  const monday = parseLocalDate(getLastMondayISO());
  monday.setDate(monday.getDate() - 7); // start at last week's Monday

  for (let i = 0; i < STREAK_MAX_WEEKS; i++) {
    const { completionRate } = computeWeekStats(activities, completions, toLocalISODate(monday));
    if (completionRate < STREAK_THRESHOLD) break;
    streak++;
    monday.setDate(monday.getDate() - 7);
  }

  return streak;
}

// ── Week start helper ─────────────────────────────────────────────────────────

export function getLastMondayISO(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  today.setDate(today.getDate() - diff);
  return toLocalISODate(today); // NOT toISOString(): French Monday 00:00 is Sunday in UTC
}
