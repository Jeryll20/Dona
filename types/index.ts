// ── Timeline types — matches CLAUDE.md § Timeline data model ─────────────────

export type CatKey = 'sommeil' | 'prep' | 'travail' | 'activite' | 'trajet' | 'repas';

export interface TimelineEvent {
  cat: CatKey;
  title: string;
  start: number;    // decimal hours (e.g. 7.67 = 07:40)
  end: number;
  thin?: boolean;   // thin stripe style for short commute blocks
  dur?: string;     // display string for thin blocks (e.g. "20 min")
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'custom';

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// ── User-defined repeating activity ──────────────────────────────────────────

export interface UserActivity {
  id: string;
  title: string;
  cat: CatKey;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  days: WeekDay[];
  recurrence: Recurrence;
}

// ── Suggestion ────────────────────────────────────────────────────────────────

export type SuggestionCat = 'sport' | 'goal' | 'rest' | 'social' | 'admin' | 'learning';

export interface Suggestion {
  id: string;
  title: string;
  cat: SuggestionCat;
  durationMinutes: number;
  startHour?: number;
  reasoning?: string;
  accepted?: boolean;
  dismissed?: boolean;
}

// ── User profile ──────────────────────────────────────────────────────────────

export interface UserProfile {
  fullName: string;
  dateOfBirth?: string;   // ISO date
  email: string;
}

export interface SleepSchedule {
  bedtime: string;        // "HH:MM"
  waketime: string;       // "HH:MM"
  sleepHours: number;     // 5–11
  prepMinutes: number;    // morning prep duration
}

export interface MealEntry {
  time:  string;  // "HH:MM"
  label: string;  // e.g. "Déjeuner", "Collation", "Petit-déjeuner"
}

export interface MealSchedule {
  times?:   string[];     // legacy — ["HH:MM", ...]
  entries?: MealEntry[];  // current — [{ time, label }, ...]
}

export interface SportInfo {
  active: boolean;
  interested: boolean;
  activity?: string;      // comma-separated activity names from q5
  schedule?: string;
  location?: string;
}

export interface WorkInfo {
  employed: boolean;
  interested: boolean;
  role?: string;          // goal key from q6: 'organise' | 'activite' | 'routine'
  schedule?: string;
  location?: string;
}

export interface CycleInfo {
  tracking: boolean;
  lastPeriodDate?: string; // ISO date
  cycleDays: number;
}

// ── Cycle phase ───────────────────────────────────────────────────────────────

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
