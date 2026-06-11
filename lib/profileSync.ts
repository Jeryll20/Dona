import { supabase } from './supabase';
import { useUserStore } from '@/store/useUserStore';
import { markSyncDirty } from './syncGuard';

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
  cycle:          Record<string, unknown> | null;
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
    // cycle is null remotely when the user hasn't opted into cloud sync —
    // keep the local (device-only) cycle data in that case
    ...(row.cycle ? { cycle: row.cycle as never } : {}),
  });
  return true;
}

export async function pushProfile(userId: string): Promise<boolean> {
  const { isOnboarded, profile, sleep, meals, sport, work, otherActivity, cycle } =
    useUserStore.getState();

  try {
    const { error } = await supabase.from('profiles').upsert({
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
      // Health data (RGPD art. 9): only synced with explicit consent.
      // Pushing null also ERASES previously synced cycle data when the
      // user turns the consent off.
      cycle:          cycle.syncConsent ? cycle : null,
      updated_at:     new Date().toISOString(),
    });
    if (error) { await markSyncDirty(); return false; }
    return true;
  } catch {
    await markSyncDirty();
    return false;
  }
}
