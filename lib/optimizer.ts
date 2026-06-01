import type { ScheduleEvent, Suggestion, OnboardingData, CyclePhase } from '../types';

// ── Cycle phase detection ─────────────────────────────────────────

export function getCyclePhase(lastPeriodDate: string, cycleDays: number): CyclePhase {
  const last = new Date(lastPeriodDate);
  const today = new Date();
  const elapsed = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)) % cycleDays;

  if (elapsed <= 5) return 'menstrual';
  if (elapsed <= 13) return 'follicular';
  if (elapsed <= 16) return 'ovulation';
  return 'luteal';
}

// ── Free slot detection ────────────────────────────────────────────

interface TimeSlot {
  startHour: number;
  endHour: number;
  durationMinutes: number;
}

export function detectFreeSlots(events: ScheduleEvent[]): TimeSlot[] {
  const sorted = [...events].sort((a, b) => a.startHour - b.startHour);
  const slots: TimeSlot[] = [];
  let cursor = 7; // start detecting from 7am

  for (const ev of sorted) {
    if (ev.startHour > cursor + 0.25) {
      // gap of at least 15 minutes
      slots.push({
        startHour: cursor,
        endHour: ev.startHour,
        durationMinutes: Math.round((ev.startHour - cursor) * 60),
      });
    }
    cursor = Math.max(cursor, ev.endHour);
  }

  // Evening slot after last event until 23:00
  if (cursor < 23) {
    slots.push({
      startHour: cursor,
      endHour: 23,
      durationMinutes: Math.round((23 - cursor) * 60),
    });
  }

  return slots.filter((s) => s.durationMinutes >= 15);
}

// ── Suggestion scoring ────────────────────────────────────────────

function energyLevel(hour: number): 'high' | 'medium' | 'low' {
  if (hour >= 6 && hour < 10) return 'high';
  if (hour >= 10 && hour < 12) return 'high';
  if (hour >= 12 && hour < 14) return 'low';  // post-lunch dip
  if (hour >= 14 && hour < 18) return 'medium';
  return 'low';
}

export function generateSuggestions(
  slots: TimeSlot[],
  data: OnboardingData,
  phase?: CyclePhase
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  let idCounter = 0;

  for (const slot of slots) {
    const energy = energyLevel(slot.startHour);
    const duration = slot.durationMinutes;

    if (energy === 'high' && duration >= 30) {
      suggestions.push({
        id: `sg-${idCounter++}`,
        title: data.sport?.interested
          ? `${data.sport.activity || 'Workout'} session`
          : 'Focus work block',
        category: 'goal',
        durationMinutes: Math.min(duration, 90),
        startHour: slot.startHour,
        reasoning: 'High energy window — great for demanding tasks',
      });
    }

    if (energy === 'low' && duration >= 20) {
      const restTitle =
        phase === 'menstrual' || phase === 'luteal'
          ? 'Gentle yoga or rest'
          : 'Power nap (20 min)';
      suggestions.push({
        id: `sg-${idCounter++}`,
        title: restTitle,
        category: 'rest',
        durationMinutes: 20,
        startHour: slot.startHour,
        reasoning: phase
          ? `Cycle phase (${phase}): rest is beneficial`
          : 'Low energy window — recharge',
      });
    }

    if (duration >= 30 && data.sport?.interested && !data.sport.active) {
      suggestions.push({
        id: `sg-${idCounter++}`,
        title: `Try ${data.sport.activity || 'a new activity'} (you wanted to!)`,
        category: 'sport',
        durationMinutes: 30,
        startHour: slot.startHour,
        reasoning: "You mentioned you'd like to exercise",
      });
    }
  }

  return suggestions.slice(0, 8);
}
