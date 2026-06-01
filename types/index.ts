// ── Schedule types ────────────────────────────────────────────────

export type EventCategory =
  | 'sleep'
  | 'prep'
  | 'work'
  | 'activity'
  | 'transit'
  | 'meal'
  | 'rest'
  | 'goal'
  | 'social'
  | 'admin'
  | 'learning';

export interface ScheduleEvent {
  id: string;
  title: string;
  category: EventCategory;
  startHour: number;  // 0–24 float, e.g. 7.5 = 07:30
  endHour: number;
  location?: string;
  thin?: boolean;     // short connector block (transit, etc.)
  recurrence?: Recurrence;
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'biweekly' | 'custom';

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// ── Activity (user-defined repeating block) ───────────────────────

export interface UserActivity {
  id: string;
  title: string;
  category: EventCategory;
  startTime: string;   // "HH:MM"
  endTime: string;     // "HH:MM"
  days: WeekDay[];
  recurrence: Recurrence;
  location?: string;
}

// ── Suggestion ────────────────────────────────────────────────────

export type SuggestionCategory =
  | 'sport'
  | 'goal'
  | 'rest'
  | 'social'
  | 'admin'
  | 'learning';

export interface Suggestion {
  id: string;
  title: string;
  category: SuggestionCategory;
  durationMinutes: number;
  startHour?: number;
  reasoning?: string;
  accepted?: boolean;
  dismissed?: boolean;
}

// ── User profile ──────────────────────────────────────────────────

export interface UserProfile {
  fullName: string;
  dateOfBirth?: string;   // ISO date
  email: string;
}

export interface SleepSchedule {
  bedtime: string;         // "HH:MM"
  wakeTime: string;        // "HH:MM"
  prepMinutes: number;
  sleepHours: number;
}

export interface MealSchedule {
  times: string[];         // ["HH:MM", ...]
}

export interface SportInfo {
  active: boolean;
  interested: boolean;
  activity?: string;
  schedule?: string;
  location?: string;
}

export interface WorkInfo {
  employed: boolean;
  interested: boolean;
  role?: string;
  schedule?: string;
  location?: string;
}

export interface CycleInfo {
  tracking: boolean;
  lastPeriodDate?: string; // ISO date
  cycleDays: number;
}

export interface OnboardingData {
  profile: Partial<UserProfile>;
  sleep: Partial<SleepSchedule>;
  meals: Partial<MealSchedule>;
  sport: Partial<SportInfo>;
  work: Partial<WorkInfo>;
  otherActivities: Partial<SportInfo>[];
  cycle: Partial<CycleInfo>;
}

// ── Cycle phase ────────────────────────────────────────────────────

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
