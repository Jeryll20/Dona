import { supabase } from './supabase';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay, formatFreeSlotsForAI } from './optimizer';
import type { CatKey, WeekDay, Recurrence } from '@/types';

// ── Action types ──────────────────────────────────────────────────────────────

export interface AddActivityAction {
  type: 'add_activity';
  payload: {
    title:      string;
    cat:        CatKey;
    startTime:  string;   // "HH:MM"
    endTime:    string;   // "HH:MM"
    days:       WeekDay[];
    recurrence: Recurrence;
  };
}

export interface UpdateSleepAction {
  type: 'update_sleep';
  payload: {
    bedtime?:     string;
    waketime?:    string;
    prepMinutes?: number;
  };
}

export type PlanningAction = AddActivityAction | UpdateSleepAction;

// ── Response type ─────────────────────────────────────────────────────────────

export interface AiResponse {
  message:  string;
  chips:    string[] | null;
  navigate: string | null;
  action:   PlanningAction | null;
}

export type HistoryMessage = { role: 'user' | 'assistant'; content: string };

// ── Client ────────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  history: HistoryMessage[],
): Promise<AiResponse> {
  const { profile, sleep, meals, sport, work, cycle } = useUserStore.getState();
  const { activities } = useScheduleStore.getState();

  const mealEntries =
    meals.entries ??
    (meals.times ?? []).map((t) => ({ time: t, label: t }));

  // Build the base day to derive free slots
  const baseEvents  = buildDefaultDay(
    { bedtime: sleep.bedtime ?? '23:00', waketime: sleep.waketime ?? '07:00', prepMinutes: sleep.prepMinutes ?? 40 },
    meals,
  );

  // Merge in user activities for a complete picture
  const activityEvents = activities.map((a) => ({
    cat:   a.cat,
    title: a.title,
    start: toH(a.startTime),
    end:   toH(a.endTime),
  }));
  const allEvents = [...baseEvents, ...activityEvents].sort((a, b) => a.start - b.start);

  const freeSlots = formatFreeSlotsForAI(allEvents);

  const activitiesSummary = activities.length
    ? activities.map((a) => `${a.title} (${a.days.join(', ')} · ${a.startTime}-${a.endTime})`).join(', ')
    : 'Aucune activité enregistrée';

  const userContext = {
    firstName:         profile.firstName,
    bedtime:           sleep.bedtime,
    waketime:          sleep.waketime,
    prepMinutes:       sleep.prepMinutes,
    meals:             mealEntries,
    activities:        sport.activity,
    goal:              work.role,
    cycleTracking:     cycle.tracking,
    freeSlots,
    existingActivities: activitiesSummary,
  };

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, history, userContext },
  });

  if (error) {
    let detail = error.message ?? 'AI request failed';
    try {
      const ctx = (error as any).context as Response | undefined;
      if (ctx && typeof ctx.text === 'function') {
        const body = await ctx.text();
        console.error('[ai] function response body:', body);
        const parsed = JSON.parse(body);
        detail = parsed.error ?? body;
      }
    } catch {}
    console.error('[ai] invoke error detail:', detail);
    throw new Error(detail);
  }
  if (!data?.message) {
    console.error('[ai] unexpected response:', data);
    throw new Error('Empty AI response');
  }

  // Normalize action field
  const action: PlanningAction | null = data.action ?? null;
  return { ...data, action } as AiResponse;
}

function toH(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}
