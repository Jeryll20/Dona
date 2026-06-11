import { detectFreeSlots, buildDayEvents } from './optimizer';
import { getCyclePhaseForDate } from './cycle';
import { isActivityVisibleOn, parseLocalDate, toLocalISODate } from './recurrence';
import { genId } from './id';
import type {
  TimelineEvent, UserActivity, ActivityCompletion, MealSchedule,
  CyclePhase, WeekDay, CatKey,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlanProposal {
  id:        string;
  date:      string;   // local "YYYY-MM-DD"
  weekDay:   WeekDay;
  title:     string;
  cat:       CatKey;
  startTime: string;   // "HH:MM"
  endTime:   string;   // "HH:MM"
  reason:    string;   // human-readable justification (FR)
  recurring: boolean;  // true = create as weekly activity, false = one-off
}

export interface PlannerInput {
  goal?:       string; // 'organise' | 'activite' | 'routine'
  activities:  UserActivity[];
  completions: ActivityCompletion[];
  sleep:       { bedtime?: string; waketime?: string; prepMinutes?: number };
  meals?:      Partial<MealSchedule>;
  cycle?:      { tracking?: boolean; lastPeriodDate?: string; cycleDays?: number };
  weekStart:   string; // Monday "YYYY-MM-DD" of the target week
}

interface DayContext {
  date:    string;
  weekDay: WeekDay;
  phase?:  CyclePhase;
  energy:  number; // 0 (rest) → 3 (peak)
  slots:   { start: number; end: number; duration: number }[];
}

const DAY_MAP: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_PROPOSALS = 6;
const MIN_SLOT_H = 0.5;

const PHASE_ENERGY: Record<CyclePhase, number> = {
  menstrual: 0, luteal: 1, follicular: 3, ovulation: 3,
};

const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual:  'phase menstruelle',
  follicular: 'phase folliculaire — ton pic d\'énergie',
  ovulation:  'ovulation — énergie et sociabilité au top',
  luteal:     'phase lutéale — on lève un peu le pied',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toH(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

function toHHMM(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function durationH(a: UserActivity): number {
  let d = toH(a.endTime) - toH(a.startTime);
  if (d <= 0) d += 24;
  return d;
}

/** First slot of the day that fits `durationH`, preferring one close to `nearH`. */
function findSlot(ctx: DayContext, durH: number, nearH?: number) {
  const fitting = ctx.slots.filter((sl) => sl.duration >= durH);
  if (fitting.length === 0) return null;
  if (nearH == null) return fitting[0];
  return [...fitting].sort(
    (a, b) => Math.abs(a.start - nearH) - Math.abs(b.start - nearH),
  )[0];
}

/** Consumes time from a day's slots so later proposals don't overlap. */
function takeSlot(ctx: DayContext, startH: number, durH: number) {
  const idx = ctx.slots.findIndex((sl) => sl.start <= startH && sl.end >= startH + durH);
  if (idx === -1) return;
  const sl = ctx.slots[idx];
  const before = { start: sl.start, end: startH, duration: startH - sl.start };
  const after  = { start: startH + durH, end: sl.end, duration: sl.end - (startH + durH) };
  ctx.slots.splice(idx, 1,
    ...[before, after].filter((s) => s.duration >= MIN_SLOT_H));
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function generateWeekPlan(input: PlannerInput): PlanProposal[] {
  const { goal, activities, sleep, meals, cycle, weekStart } = input;
  const proposals: PlanProposal[] = [];

  const cycleActive = !!(cycle?.tracking && cycle.lastPeriodDate);
  const wake = sleep.waketime ? toH(sleep.waketime) : 7;
  const bed  = sleep.bedtime  ? toH(sleep.bedtime)  : 23;

  // ── Build the 7 day contexts ────────────────────────────────────────────────
  const days: DayContext[] = [];
  const base = parseLocalDate(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const date = toLocalISODate(d);
    const weekDay = DAY_MAP[d.getDay()];

    const profileEvents = (sleep.waketime && sleep.bedtime && sleep.prepMinutes != null)
      ? buildDayEvents(
          { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
          meals,
        )
      : [];
    const activityEvents: TimelineEvent[] = activities
      .filter((a) => isActivityVisibleOn(a, date))
      .map((a) => ({ cat: a.cat, title: a.title, start: toH(a.startTime), end: toH(a.startTime) + durationH(a) }));

    // Waking hours only, slots of at least 30 min
    const slots = detectFreeSlots([...profileEvents, ...activityEvents])
      .map((sl) => ({ start: Math.max(sl.start, wake), end: Math.min(sl.end, bed) }))
      .map((sl) => ({ ...sl, duration: sl.end - sl.start }))
      .filter((sl) => sl.duration >= MIN_SLOT_H);

    const phase = cycleActive
      ? getCyclePhaseForDate(cycle!.lastPeriodDate!, cycle!.cycleDays ?? 28, date)
      : undefined;

    days.push({
      date, weekDay, phase,
      energy: phase ? PHASE_ENERGY[phase] : 2,
      slots,
    });
  }

  const push = (p: Omit<PlanProposal, 'id'>, durH: number, startH: number, day: DayContext) => {
    if (proposals.length >= MAX_PROPOSALS) return;
    proposals.push({ id: genId(), ...p });
    takeSlot(day, startH, durH);
  };

  // ── 1. Fill sport weekly goals on high-energy days ──────────────────────────
  for (const sport of activities.filter((a) => a.cat === 'sport' && a.weeklyGoal)) {
    const scheduled = days.filter((d) => isActivityVisibleOn(sport, d.date)).length;
    let missing = Math.max(0, (sport.weeklyGoal ?? 0) - scheduled);
    if (missing === 0) continue;

    const durH  = Math.min(durationH(sport), 1.5);
    const nearH = toH(sport.startTime);

    // Highest-energy days first, skipping days that already host this sport
    const candidates = [...days]
      .filter((d) => !isActivityVisibleOn(sport, d.date))
      .sort((a, b) => b.energy - a.energy);

    for (const day of candidates) {
      if (missing === 0 || proposals.length >= MAX_PROPOSALS) break;

      if (day.phase === 'menstrual') {
        // Gentle alternative instead of the usual session
        const slot = findSlot(day, 0.5, nearH);
        if (!slot) continue;
        push({
          date: day.date, weekDay: day.weekDay,
          title: 'Yoga doux ou marche',
          cat: 'sport',
          startTime: toHHMM(slot.start), endTime: toHHMM(slot.start + 0.5),
          reason: `À la place d'une grosse séance : ${PHASE_LABEL.menstrual}, ton corps te dira merci.`,
          recurring: false,
        }, 0.5, slot.start, day);
      } else {
        const slot = findSlot(day, durH, nearH);
        if (!slot) continue;
        const start = Math.max(slot.start, Math.min(nearH, slot.end - durH));
        push({
          date: day.date, weekDay: day.weekDay,
          title: sport.title,
          cat: 'sport',
          startTime: toHHMM(start), endTime: toHHMM(start + durH),
          reason: day.phase
            ? `Pour atteindre ton objectif de ${sport.weeklyGoal}/semaine — ${PHASE_LABEL[day.phase]}.`
            : `Pour atteindre ton objectif de ${sport.weeklyGoal} séances/semaine.`,
          recurring: false,
        }, durH, start, day);
      }
      missing--;
    }
  }

  // ── 2. Rest proposal on menstrual days ──────────────────────────────────────
  if (cycleActive) {
    const menstrualDay = days.find((d) => d.phase === 'menstrual' && d.slots.length > 0);
    if (menstrualDay && proposals.length < MAX_PROPOSALS) {
      const slot = findSlot(menstrualDay, 0.25, 18);
      if (slot) {
        push({
          date: menstrualDay.date, weekDay: menstrualDay.weekDay,
          title: 'Pause bien-être',
          cat: 'activite',
          startTime: toHHMM(slot.start), endTime: toHHMM(slot.start + 0.25),
          reason: `Un moment pour toi — ${PHASE_LABEL.menstrual}.`,
          recurring: false,
        }, 0.25, slot.start, menstrualDay);
      }
    }
  }

  // ── 3. Goal-driven structure ────────────────────────────────────────────────
  if (goal === 'routine') {
    // Habit anchors at consistent times, created as weekly activities
    const anchors = [
      { title: 'Écriture / journaling', durH: 1 / 3, nearH: wake + 0.75, reason: 'Une ancre matinale régulière, la base d\'une routine qui tient.' },
      { title: 'Lecture / déconnexion', durH: 1 / 3, nearH: bed - 1,     reason: 'Un rituel du soir à heure fixe pour ancrer ta routine.' },
    ];
    for (const anchor of anchors) {
      // Pick the weekday with the most room, propose it as recurring
      const day = [...days]
        .filter((d) => findSlot(d, anchor.durH, anchor.nearH))
        .sort((a, b) => b.slots.length - a.slots.length)[0];
      if (!day || proposals.length >= MAX_PROPOSALS) break;
      const slot = findSlot(day, anchor.durH, anchor.nearH)!;
      const start = Math.max(slot.start, Math.min(anchor.nearH, slot.end - anchor.durH));
      push({
        date: day.date, weekDay: day.weekDay,
        title: anchor.title, cat: 'activite',
        startTime: toHHMM(start), endTime: toHHMM(start + anchor.durH),
        reason: anchor.reason,
        recurring: true,
      }, anchor.durH, start, day);
    }
  } else if (goal === 'organise') {
    const day = days.find((d) => d.weekDay === 'Sun' && findSlot(d, 0.25, 18)) ?? days[0];
    const slot = findSlot(day, 0.25, 18);
    if (slot && proposals.length < MAX_PROPOSALS) {
      push({
        date: day.date, weekDay: day.weekDay,
        title: 'Préparer ma semaine', cat: 'activite',
        startTime: toHHMM(slot.start), endTime: toHHMM(slot.start + 0.25),
        reason: '15 minutes le dimanche pour aborder la semaine l\'esprit clair.',
        recurring: true,
      }, 0.25, slot.start, day);
    }
  } else if (goal === 'activite') {
    // Add gentle discovery sessions on energetic days
    const day = [...days].sort((a, b) => b.energy - a.energy)
      .find((d) => findSlot(d, 0.5, 17.5));
    if (day && proposals.length < MAX_PROPOSALS) {
      const slot = findSlot(day, 0.5, 17.5)!;
      push({
        date: day.date, weekDay: day.weekDay,
        title: 'Nouvelle activité à essayer', cat: 'activite',
        startTime: toHHMM(slot.start), endTime: toHHMM(slot.start + 0.5),
        reason: day.phase
          ? `Un créneau idéal pour tester quelque chose de nouveau — ${PHASE_LABEL[day.phase]}.`
          : 'Un créneau libre parfait pour découvrir une nouvelle activité.',
        recurring: false,
      }, 0.5, slot.start, day);
    }
  }

  // Chronological order reads better in the plan card
  return proposals.sort((a, b) =>
    a.date === b.date ? toH(a.startTime) - toH(b.startTime) : a.date.localeCompare(b.date));
}

// ── Target week helper ────────────────────────────────────────────────────────

/** Monday of the upcoming week if we're past Thursday, else the current week. */
export function getPlanningWeekStart(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);
  if (day === 0 || day >= 5) monday.setDate(monday.getDate() + 7); // Fri/Sat/Sun → plan next week
  return toLocalISODate(monday);
}
