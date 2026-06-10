import { supabase } from './supabase';
import { useScheduleStore } from '@/store/useScheduleStore';
import type { UserActivity, ActivityOverride, CatKey, WeekDay, Recurrence, ActivityLocation } from '@/types';

// ── Converters ────────────────────────────────────────────────────────────────

function activityToRow(userId: string, a: UserActivity) {
  return {
    id:                    a.id,
    user_id:               userId,
    title:                 a.title,
    cat:                   a.cat,
    custom_cat_id:         a.customCatId       ?? null,
    start_time:            a.startTime,
    end_time:              a.endTime,
    days:                  a.days,
    recurrence:            a.recurrence,
    anchor_date:           a.anchorDate        ?? null,
    color:                 a.color             ?? null,
    notify_week_end:       a.notifyWeekEnd     ?? false,
    location:              a.location          ?? null,
    departure_location:    a.departureLocation ?? null,
    trajet_minutes_before: a.trajetMinutesBefore ?? null,
    updated_at:            new Date().toISOString(),
  };
}

function rowToActivity(row: Record<string, unknown>): UserActivity {
  return {
    id:                  row.id as string,
    title:               row.title as string,
    cat:                 row.cat as CatKey,
    customCatId:         (row.custom_cat_id as string | null) ?? undefined,
    startTime:           row.start_time as string,
    endTime:             row.end_time as string,
    days:                row.days as WeekDay[],
    recurrence:          row.recurrence as Recurrence,
    anchorDate:          (row.anchor_date as string | null) ?? undefined,
    color:               (row.color as { bg: string; ink: string } | null) ?? undefined,
    notifyWeekEnd:       (row.notify_week_end as boolean) ?? false,
    location:            (row.location as ActivityLocation | null) ?? undefined,
    departureLocation:   (row.departure_location as ActivityLocation | null) ?? undefined,
    trajetMinutesBefore: (row.trajet_minutes_before as number | null) ?? undefined,
  };
}

function overrideToRow(userId: string, o: ActivityOverride) {
  return {
    user_id:     userId,
    activity_id: o.activityId,
    date:        o.date,
    title:       o.title      ?? null,
    start_time:  o.startTime  ?? null,
    end_time:    o.endTime    ?? null,
    color:       o.color      ?? null,
    cancelled:   o.cancelled  ?? false,
    updated_at:  new Date().toISOString(),
  };
}

function rowToOverride(row: Record<string, unknown>): ActivityOverride {
  return {
    activityId: row.activity_id as string,
    date:       row.date        as string,
    title:      (row.title      as string | null) ?? undefined,
    startTime:  (row.start_time as string | null) ?? undefined,
    endTime:    (row.end_time   as string | null) ?? undefined,
    color:      (row.color      as { bg: string; ink: string } | null) ?? undefined,
    cancelled:  (row.cancelled  as boolean) ?? false,
  };
}

// ── Push all local data (used on first sync / onboarding completion) ──────────

export async function pushAllActivities(userId: string): Promise<void> {
  const { activities, overrides } = useScheduleStore.getState();

  await Promise.all([
    supabase.from('user_activities').delete().eq('user_id', userId),
    supabase.from('activity_overrides').delete().eq('user_id', userId),
  ]);

  if (activities.length > 0) {
    await supabase.from('user_activities').insert(
      activities.map((a) => activityToRow(userId, a)),
    );
  }
  if (overrides.length > 0) {
    await supabase.from('activity_overrides').insert(
      overrides.map((o) => overrideToRow(userId, o)),
    );
  }
}

// ── Fetch remote → hydrate local (smart: prefers remote, pushes local if remote empty) ──

export async function fetchAndHydrateActivities(userId: string): Promise<boolean> {
  const [activitiesRes, overridesRes] = await Promise.all([
    supabase.from('user_activities').select('*').eq('user_id', userId),
    supabase.from('activity_overrides').select('*').eq('user_id', userId),
  ]);

  if (activitiesRes.error || overridesRes.error) return false;

  const remoteActivities = (activitiesRes.data ?? []).map(
    (r) => rowToActivity(r as Record<string, unknown>),
  );
  const remoteOverrides = (overridesRes.data ?? []).map(
    (r) => rowToOverride(r as Record<string, unknown>),
  );

  if (remoteActivities.length > 0 || remoteOverrides.length > 0) {
    // Remote has data → authoritative (multi-device sync)
    useScheduleStore.setState({ activities: remoteActivities, overrides: remoteOverrides });
  } else {
    // Remote empty → first sync, push whatever is stored locally
    const local = useScheduleStore.getState();
    if (local.activities.length > 0 || local.overrides.length > 0) {
      await pushAllActivities(userId);
    }
  }

  return true;
}

// ── Individual record mutations ───────────────────────────────────────────────

export async function upsertActivity(userId: string, activity: UserActivity): Promise<void> {
  await supabase.from('user_activities').upsert(activityToRow(userId, activity));
}

export async function deleteActivityRemote(userId: string, activityId: string): Promise<void> {
  await supabase.from('user_activities').delete()
    .eq('user_id', userId)
    .eq('id', activityId);
}

export async function upsertOverride(userId: string, override: ActivityOverride): Promise<void> {
  await supabase.from('activity_overrides')
    .upsert(overrideToRow(userId, override), { onConflict: 'user_id,activity_id,date' });
}

export async function deleteOverrideRemote(
  userId: string,
  activityId: string,
  date: string,
): Promise<void> {
  await supabase.from('activity_overrides').delete()
    .eq('user_id', userId)
    .eq('activity_id', activityId)
    .eq('date', date);
}
