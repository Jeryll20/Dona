import { supabase } from './supabase';
import { useUserStore } from '@/store/useUserStore';

interface ProfileRow {
  id:           string;
  is_onboarded: boolean;
  sleep:        Record<string, unknown>;
  meals:        Record<string, unknown>;
  sport:        Record<string, unknown>;
  work:         Record<string, unknown>;
  cycle:        Record<string, unknown>;
}

export async function fetchAndHydrateProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return false; // No remote profile yet — keep local state

  const row = data as ProfileRow;
  useUserStore.setState({
    isOnboarded: row.is_onboarded,
    sleep:       row.sleep as never,
    meals:       row.meals as never,
    sport:       row.sport as never,
    work:        row.work  as never,
    cycle:       row.cycle as never,
  });
  return true;
}

export async function pushProfile(userId: string): Promise<void> {
  const { isOnboarded, sleep, meals, sport, work, cycle } = useUserStore.getState();
  await supabase.from('profiles').upsert({
    id:           userId,
    is_onboarded: isOnboarded,
    sleep,
    meals,
    sport,
    work,
    cycle,
    updated_at:   new Date().toISOString(),
  });
}
