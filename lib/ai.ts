import { supabase } from './supabase';
import { useUserStore } from '@/store/useUserStore';

export interface AiResponse {
  message:  string;
  chips:    string[] | null;
  navigate: string | null;
}

export type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function sendChatMessage(
  message: string,
  history: HistoryMessage[],
): Promise<AiResponse> {
  const { profile, sleep, meals, sport, work, cycle } = useUserStore.getState();

  const mealEntries =
    meals.entries ??
    (meals.times ?? []).map((t) => ({ time: t, label: t }));

  const userContext = {
    firstName:    profile.firstName,
    bedtime:      sleep.bedtime,
    waketime:     sleep.waketime,
    prepMinutes:  sleep.prepMinutes,
    meals:        mealEntries,
    activities:   sport.activity,
    goal:         work.role,
    cycleTracking: cycle.tracking,
  };

  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message, history, userContext },
  });

  if (error) throw new Error(error.message ?? 'AI request failed');
  return data as AiResponse;
}
