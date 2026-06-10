import type { TimelineEvent, Suggestion, SuggestionCat, CyclePhase, MealEntry } from '@/types';

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

export function detectFreeSlots(events: TimelineEvent[]): FreeSlot[] {
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

function hToHHMM(h: number): string {
  const hh = Math.floor(h);
  const mm  = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function formatFreeSlotsForAI(events: TimelineEvent[]): string {
  const slots = detectFreeSlots(events).filter((s) => s.duration >= 0.25);
  if (!slots.length) return 'Aucun créneau libre significatif.';
  return slots
    .map((s) => {
      const h = Math.floor(s.duration);
      const m = Math.round((s.duration - h) * 60);
      const dur = h > 0 ? `${h}h${m > 0 ? m : ''}` : `${m} min`;
      return `${hToHHMM(s.start)} → ${hToHHMM(s.end)} (${dur} libres)`;
    })
    .join('\n');
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

// ── Public API ────────────────────────────────────────────────────────────────
// (cycle phase detection lives in lib/cycle.ts — single source of truth)

export interface OptimizerInput {
  events: TimelineEvent[];
  goal?: string;        // 'organise' | 'activite' | 'routine'
  cyclePhase?: CyclePhase;
}

export function buildSuggestions(input: OptimizerInput): Suggestion[] {
  const { events, goal, cyclePhase } = input;
  const slots = detectFreeSlots(events);

  if (slots.length === 0) return [];

  const goalOrder  = goalBoost(goal);
  const cycleOrder = cycleBoost(cyclePhase);

  // Collect best score + matching slot for each unique template title
  const byTitle = new Map<string, { t: SuggestionTemplate; score: number; slot: FreeSlot }>();

  for (const slot of slots) {
    const timeOrder = timeOfDayCategories(slot.start);
    for (const cat of Object.keys(POOL) as SuggestionCat[]) {
      for (const t of POOL[cat]) {
        if (t.minSlotHours > slot.duration) continue;
        const score = scoreCat(cat, timeOrder, goalOrder, cycleOrder);
        const prev  = byTitle.get(t.title);
        if (!prev || prev.score < score) {
          byTitle.set(t.title, { t, score, slot });
        }
      }
    }
  }

  // Sort by score desc; shuffle within same-score tiers for variety
  const sorted = [...byTitle.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return Math.random() - 0.5;
  });

  return sorted.slice(0, 3).map((c, i) => ({
    id:              String(i + 1),
    title:           c.t.title,
    cat:             c.t.cat,
    durationMinutes: c.t.durationMinutes,
    startHour:       c.slot.start,
  }));
}

// ── Build day events from user profile (day-aware) ───────────────────────────

function toH(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

function mealLabel(startH: number): string {
  if (startH < 11) return 'Petit-déjeuner';
  if (startH < 15) return 'Déjeuner';
  return 'Dîner';
}

function buildBase(
  sleep: { bedtime: string; waketime: string; prepMinutes: number },
  meals?: { entries?: MealEntry[]; times?: string[] },
): { events: TimelineEvent[]; wake: number; bed: number; prepEnd: number } {
  const wake    = toH(sleep.waketime);
  // Midnight (00:00) means end-of-day on a 24-h scale, not start
  const bed     = toH(sleep.bedtime) || 24;
  const prep    = sleep.prepMinutes / 60;
  const prepEnd = wake + prep;
  const events: TimelineEvent[] = [];

  if (wake > 0) events.push({ cat: 'sommeil', title: 'Sommeil',     start: 0,    end: wake    });
  events.push(              { cat: 'prep',    title: 'Préparation', start: wake, end: prepEnd });

  const mealList: MealEntry[] = meals?.entries
    ?? meals?.times?.map((t) => ({ time: t, label: mealLabel(toH(t)) }))
    ?? [];

  for (const m of mealList) {
    const s = toH(m.time);
    const e = s + 0.5;
    if (s >= prepEnd && s < bed) {
      events.push({ cat: 'repas', title: m.label, start: s, end: Math.min(e, bed) });
    }
  }

  if (bed < 24) events.push({ cat: 'sommeil', title: 'Sommeil', start: bed, end: 24 });
  return { events, wake, bed, prepEnd };
}

// Build profile events for a day — sleep/prep/meals only
// Work/sport/other now live in the schedule store as regular activities
export function buildDayEvents(
  sleep: { bedtime: string; waketime: string; prepMinutes: number },
  meals?: { entries?: MealEntry[]; times?: string[] },
): TimelineEvent[] {
  return buildBase(sleep, meals).events.sort((a, b) => a.start - b.start);
}

export function buildDefaultDay(
  sleep: { bedtime: string; waketime: string; prepMinutes: number },
  meals?: { entries?: MealEntry[]; times?: string[] },
): TimelineEvent[] {
  return buildBase(sleep, meals).events.sort((a, b) => a.start - b.start);
}
