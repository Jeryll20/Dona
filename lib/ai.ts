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
  return data as AiResponse;
}
