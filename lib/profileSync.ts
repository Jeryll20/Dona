import { supabase } from './supabase';
import { useUserStore } from '@/store/useUserStore';

interface ProfileRow {
  id:             string;
  is_onboarded:   boolean;
  first_name:     string | null;
  last_name:      string | null;
  date_of_birth:  string | null;
  gender:         string | null;
  goal:           string | null;
  home_location:  Record<string, unknown> | null;
  sleep:          Record<string, unknown>;
  meals:          Record<string, unknown>;
  sport:          Record<string, unknown>;
  work:           Record<string, unknown>;
  other_activity: Record<string, unknown> | null;
  cycle:          Record<string, unknown>;
}

export async function fetchAndHydrateProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return false;

  const row = data as ProfileRow;
  useUserStore.setState({
    isOnboarded: row.is_onboarded,
    profile: {
      firstName:    row.first_name    ?? undefined,
      lastName:     row.last_name     ?? undefined,
      dateOfBirth:  row.date_of_birth ?? undefined,
      gender:       row.gender        ?? undefined,
      goal:         row.goal          ?? undefined,
      homeLocation: row.home_location  ? (row.home_location as any) : undefined,
    },
    sleep:         row.sleep          as never,
    meals:         row.meals          as never,
    sport:         row.sport          as never,
    work:          row.work           as never,
    otherActivity: row.other_activity ? (row.other_activity as never) : {},
    cycle:         row.cycle          as never,
  });
  return true;
}

export async function pushProfile(userId: string): Promise<void> {
  const { isOnboarded, profile, sleep, meals, sport, work, otherActivity, cycle } =
    useUserStore.getState();

  await supabase.from('profiles').upsert({
    id:             userId,
    is_onboarded:   isOnboarded,
    first_name:     profile.firstName    ?? null,
    last_name:      profile.lastName     ?? null,
    date_of_birth:  profile.dateOfBirth  ?? null,
    gender:         profile.gender       ?? null,
    goal:           profile.goal         ?? null,
    home_location:  profile.homeLocation ?? null,
    sleep,
    meals,
    sport,
    work,
    other_activity: otherActivity,
    cycle,
    updated_at:     new Date().toISOString(),
  });
}
