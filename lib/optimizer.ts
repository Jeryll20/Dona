import type { TimelineEvent, Suggestion, SuggestionCat, CyclePhase } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SLOT_H = 0.25; // 15 min minimum free slot

// ── Suggestion pool ───────────────────────────────────────────────────────────

interface SuggestionTemplate {
  title: string;
  cat: SuggestionCat;
  durationMinutes: number;
  minSlotHours: number;
}

const POOL: Record<SuggestionCat, SuggestionTemplate[]> = {
  sport: [
    { title: 'Stretching',           cat: 'sport',    durationMinutes: 15, minSlotHours: 0.25 },
    { title: 'Marche 30 min',        cat: 'sport',    durationMinutes: 30, minSlotHours: 0.5  },
    { title: 'Yoga',                 cat: 'sport',    durationMinutes: 30, minSlotHours: 0.5  },
    { title: 'Course à pied 45 min', cat: 'sport',    durationMinutes: 45, minSlotHours: 0.75 },
  ],
  goal: [
    { title: 'Écriture / journaling',       cat: 'goal', durationMinutes: 20, minSlotHours: 0.35 },
    { title: 'Apprentissage langue 20 min', cat: 'goal', durationMinutes: 20, minSlotHours: 0.35 },
    { title: 'Projet personnel 45 min',     cat: 'goal', durationMinutes: 45, minSlotHours: 0.75 },
  ],
  rest: [
    { title: 'Pause sans écran',    cat: 'rest', durationMinutes: 15, minSlotHours: 0.25 },
    { title: 'Méditation',          cat: 'rest', durationMinutes: 15, minSlotHours: 0.25 },
    { title: 'Micro-sieste 20 min', cat: 'rest', durationMinutes: 20, minSlotHours: 0.35 },
  ],
  social: [
    { title: 'Appeler un proche',   cat: 'social', durationMinutes: 20, minSlotHours: 0.35 },
    { title: 'Planifier une sortie',cat: 'social', durationMinutes: 15, minSlotHours: 0.25 },
  ],
  admin: [
    { title: 'Liste de courses',       cat: 'admin', durationMinutes: 15, minSlotHours: 0.25 },
    { title: 'Payer les factures',     cat: 'admin', durationMinutes: 20, minSlotHours: 0.35 },
    { title: 'Organiser ses fichiers', cat: 'admin', durationMinutes: 30, minSlotHours: 0.5  },
  ],
  learning: [
    { title: 'Podcast / article',    cat: 'learning', durationMinutes: 15, minSlotHours: 0.25 },
    { title: 'Regarder un tutoriel', cat: 'learning', durationMinutes: 20, minSlotHours: 0.35 },
    { title: 'Lire 30 min',          cat: 'learning', durationMinutes: 30, minSlotHours: 0.5  },
  ],
};

// ── Free slot detection ───────────────────────────────────────────────────────

interface FreeSlot {
  start: number;
  end: number;
  duration: number; // decimal hours
}

function detectFreeSlots(events: TimelineEvent[]): FreeSlot[] {
  const sorted = [...events].sort((a, b) => a.start - b.start);
  const slots: FreeSlot[] = [];
  let cursor = 0;

  for (const ev of sorted) {
    const gap = ev.start - cursor;
    if (gap >= MIN_SLOT_H) {
      slots.push({ start: cursor, end: ev.start, duration: gap });
    }
    cursor = Math.max(cursor, ev.end);
  }

  const tail = 24 - cursor;
  if (tail >= MIN_SLOT_H) {
    slots.push({ start: cursor, end: 24, duration: tail });
  }

  return slots;
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

function timeOfDayCategories(hour: number): SuggestionCat[] {
  if (hour >= 5  && hour < 9)  return ['goal', 'sport', 'learning'];
  if (hour >= 9  && hour < 12) return ['goal', 'learning', 'admin'];
  if (hour >= 12 && hour < 14) return ['rest', 'social', 'admin'];
  if (hour >= 14 && hour < 18) return ['sport', 'social', 'goal'];
  if (hour >= 18 && hour < 22) return ['rest', 'social', 'learning'];
  return ['rest'];
}

function goalBoost(goal: string | undefined): SuggestionCat[] {
  if (goal === 'activite') return ['sport', 'social'];
  if (goal === 'routine')  return ['goal', 'learning'];
  return ['admin', 'goal']; // 'organise' default
}

function cycleBoost(phase: CyclePhase | undefined): SuggestionCat[] {
  if (phase === 'menstrual')  return ['rest'];
  if (phase === 'follicular') return ['sport', 'goal'];
  if (phase === 'ovulation')  return ['social', 'goal'];
  if (phase === 'luteal')     return ['rest', 'learning'];
  return [];
}

function scoreCat(
  cat: SuggestionCat,
  timeOrder: SuggestionCat[],
  goalOrder: SuggestionCat[],
  cycleOrder: SuggestionCat[],
): number {
  const ti = timeOrder.indexOf(cat);
  const gi = goalOrder.indexOf(cat);
  const ci = cycleOrder.indexOf(cat);
  return (ti  !== -1 ? (3 - ti)  * 3 : 0)
       + (gi  !== -1 ? (2 - gi)  * 2 : 0)
       + (ci  !== -1 ? (1 - ci)  * 2 : 0);
}

// ── Cycle phase detection ─────────────────────────────────────────────────────

export function getCyclePhase(lastPeriodDate: string, cycleDays: number): CyclePhase {
  const last    = new Date(lastPeriodDate);
  const today   = new Date();
  const elapsed = Math.floor((today.getTime() - last.getTime()) / 86_400_000) % cycleDays;

  if (elapsed <= 5)  return 'menstrual';
  if (elapsed <= 13) return 'follicular';
  if (elapsed <= 16) return 'ovulation';
  return 'luteal';
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface OptimizerInput {
  events: TimelineEvent[];
  goal?: string;        // 'organise' | 'activite' | 'routine'
  cyclePhase?: CyclePhase;
}

export function buildSuggestions(input: OptimizerInput): Suggestion[] {
  const { events, goal, cyclePhase } = input;
  const slots = detectFreeSlots(events);
  const suggestions: Suggestion[] = [];
  let idCounter = 0;

  for (const slot of slots) {
    if (suggestions.length >= 3) break;

    const timeOrder  = timeOfDayCategories(slot.start);
    const goalOrder  = goalBoost(goal);
    const cycleOrder = cycleBoost(cyclePhase);

    const candidates = (Object.keys(POOL) as SuggestionCat[])
      .flatMap((cat) =>
        POOL[cat].map((t) => ({ t, score: scoreCat(cat, timeOrder, goalOrder, cycleOrder) }))
      )
      .filter(({ t }) => t.minSlotHours <= slot.duration)
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) continue;

    const { t } = candidates[0];
    suggestions.push({
      id:              String(++idCounter),
      title:           t.title,
      cat:             t.cat,
      durationMinutes: t.durationMinutes,
      startHour:       slot.start,
    });
  }

  return suggestions;
}

// ── Build default day events from sleep profile ───────────────────────────────

export function buildDefaultDay(sleep: {
  bedtime: string;
  waketime: string;
  prepMinutes: number;
}): TimelineEvent[] {
  function toH(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
  }

  const wake = toH(sleep.waketime);
  const bed  = toH(sleep.bedtime);
  const prep = sleep.prepMinutes / 60;
  const events: TimelineEvent[] = [];

  if (wake > 0) events.push({ cat: 'sommeil', title: 'Sommeil',      start: 0,    end: wake       });
  events.push(            { cat: 'prep',    title: 'Préparation', start: wake, end: wake + prep });
  if (bed > 0)  events.push({ cat: 'sommeil', title: 'Sommeil',      start: bed,  end: 24          });

  return events;
}
