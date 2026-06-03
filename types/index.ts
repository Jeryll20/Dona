// ── Timeline types — matches CLAUDE.md § Timeline data model ─────────────────

export type CatKey = 'sommeil' | 'prep' | 'travail' | 'activite' | 'trajet' | 'repas';

export interface TimelineEvent {
  cat: CatKey;
  title: string;
  start: number;    // decimal hours (e.g. 7.67 = 07:40)
  end: number;
  thin?: boolean;   // thin stripe style for short commute blocks
  dur?: string;     // display string for thin blocks (e.g. "20 min")
  profileKey?: 'work' | 'sport' | 'other'; // source for tap-to-edit routing
  color?: { bg: string; ink: string };     // user-chosen color override
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'triweekly' | 'quadweekly' | 'custom';

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
  color?: { bg: string; ink: string };
  notifyWeekEnd?: boolean;
}

// ── Single-occurrence override ────────────────────────────────────────────────

export interface ActivityOverride {
  activityId: string;
  date: string;          // "YYYY-MM-DD"
  title?: string;
  startTime?: string;    // "HH:MM"
  endTime?: string;      // "HH:MM"
  color?: { bg: string; ink: string };
  cancelled?: boolean;
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
  firstName:    string;
  lastName?:    string;
  dateOfBirth?: string;   // ISO date "YYYY-MM-DD"
  gender?:      string;   // 'homme' | 'femme' | free text (inclusivité)
  goal?:        string;   // onboarding goal key: 'organise' | 'activite' | 'routine'
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
  activity?: string;
  days?: WeekDay[];
  startTime?: string;   // "HH:MM"
  endTime?: string;     // "HH:MM"
}

export interface WorkInfo {
  employed: boolean;
  interested: boolean;
  role?: string;        // job description / goal key
  days?: WeekDay[];
  startTime?: string;
  endTime?: string;
}

export interface OtherActivityInfo {
  active: boolean;
  interested: boolean;
  title?: string;
  days?: WeekDay[];
  startTime?: string;
  endTime?: string;
}

export interface CycleInfo {
  tracking: boolean;
  lastPeriodDate?: string; // ISO date
  cycleDays: number;
}

// ── Cycle phase ───────────────────────────────────────────────────────────────

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
