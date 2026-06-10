import { supabase } from './supabase';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import { markSyncDirty } from './syncGuard';
import type { ActivityCompletion } from '@/types';

// ── Converters ────────────────────────────────────────────────────────────────

function completionToRow(userId: string, c: ActivityCompletion) {
  return {
    user_id:      userId,
    activity_id:  c.activityId,
    date:         c.date,
    completed:    c.completed,
    actual_start: c.actualStart ?? null,
    actual_end:   c.actualEnd   ?? null,
    note:         c.note        ?? null,
    updated_at:   new Date().toISOString(),
  };
}

function rowToCompletion(row: Record<string, unknown>): ActivityCompletion {
  return {
    activityId:  row.activity_id  as string,
    date:        row.date         as string,
    completed:   row.completed    as boolean,
    actualStart: (row.actual_start as string | null) ?? undefined,
    actualEnd:   (row.actual_end   as string | null) ?? undefined,
    note:        (row.note         as string | null) ?? undefined,
  };
}

// ── Fetch remote → hydrate local ──────────────────────────────────────────────

export async function fetchAndHydrateCompletions(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('activity_completions')
    .select('*')
    .eq('user_id', userId);

  if (error) return false;

  const remote = (data ?? []).map((r) => rowToCompletion(r as Record<string, unknown>));

  if (remote.length > 0) {
    useBehaviorStore.setState({ completions: remote });
  } else {
    // First sync — push local completions if any
    const local = useBehaviorStore.getState().completions;
    if (local.length > 0) {
      await supabase
        .from('activity_completions')
        .insert(local.map((c) => completionToRow(userId, c)));
    }
  }

  return true;
}

// ── Full push (dirty-flag recovery) ───────────────────────────────────────────

export async function pushAllCompletions(userId: string): Promise<boolean> {
  try {
    const local = useBehaviorStore.getState().completions;
    if (local.length === 0) return true;
    const { error } = await supabase
      .from('activity_completions')
      .upsert(local.map((c) => completionToRow(userId, c)), {
        onConflict: 'user_id,activity_id,date',
      });
    if (error) { await markSyncDirty(); return false; }
    return true;
  } catch {
    await markSyncDirty();
    return false;
  }
}

// ── Individual mutations ──────────────────────────────────────────────────────

export async function upsertCompletion(
  userId: string,
  completion: ActivityCompletion,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_completions')
      .upsert(completionToRow(userId, completion), {
        onConflict: 'user_id,activity_id,date',
      });
    if (error) await markSyncDirty();
  } catch { await markSyncDirty(); }
}

export async function deleteCompletionRemote(
  userId: string,
  activityId: string,
  date: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('activity_completions')
      .delete()
      .eq('user_id', userId)
      .eq('activity_id', activityId)
      .eq('date', date);
    if (error) await markSyncDirty();
  } catch { await markSyncDirty(); }
}
