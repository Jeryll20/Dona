import type { UserActivity, WeekDay } from '@/types';

const DAY_MAP: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Local date helpers ────────────────────────────────────────────────────────
// Always use these for calendar dates. new Date("YYYY-MM-DD") parses as UTC
// midnight and toISOString() converts back to UTC — both shift the day in
// non-UTC timezones (French midnight = 22:00/23:00 UTC the previous day).

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Recurrence visibility ─────────────────────────────────────────────────────

function mondayOf(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  return r;
}

const N_WEEKS: Partial<Record<UserActivity['recurrence'], number>> = {
  biweekly: 2, triweekly: 3, quadweekly: 4,
};

/**
 * Whether an activity occurs on the given local date ("YYYY-MM-DD").
 * Checks both the weekday AND the recurrence rule relative to anchorDate.
 * Activities created before anchorDate existed fall back to weekly behavior.
 */
export function isActivityVisibleOn(a: UserActivity, dateStr: string): boolean {
  const date = parseLocalDate(dateStr);
  if (!a.days.includes(DAY_MAP[date.getDay()])) return false;
  if (!a.anchorDate) return true; // legacy data — keep previous behavior

  if (a.recurrence === 'none') {
    // One-off: only during the 7 days starting at creation
    const anchor = parseLocalDate(a.anchorDate);
    const diffDays = Math.round((date.getTime() - anchor.getTime()) / 86_400_000);
    return diffDays >= 0 && diffDays <= 6;
  }

  const n = N_WEEKS[a.recurrence];
  if (n) {
    const weeks = Math.round(
      (mondayOf(date).getTime() - mondayOf(parseLocalDate(a.anchorDate)).getTime())
      / (7 * 86_400_000),
    );
    return weeks >= 0 && weeks % n === 0;
  }

  return true; // weekly / daily / custom
}
