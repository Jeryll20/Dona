import { supabase } from './supabase';
import { useScheduleStore } from '@/store/useScheduleStore';
import { markSyncDirty } from './syncGuard';
import type { CustomCategory } from '@/types';

// ── Converters ────────────────────────────────────────────────────────────────

function catToRow(userId: string, c: CustomCategory) {
  return {
    id:         c.id,
    user_id:    userId,
    label:      c.label,
    color:      c.color,
    updated_at: new Date().toISOString(),
  };
}

function rowToCat(row: Record<string, unknown>): CustomCategory {
  return {
    id:    row.id    as string,
    label: row.label as string,
    color: row.color as { bg: string; ink: string },
  };
}

// ── Fetch remote → hydrate local ──────────────────────────────────────────────

export async function fetchAndHydrateCustomCats(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', userId);

  if (error) return false;

  const remote = (data ?? []).map((r) => rowToCat(r as Record<string, unknown>));

  if (remote.length > 0) {
    useScheduleStore.setState({ customCategories: remote });
  } else {
    const local = useScheduleStore.getState().customCategories;
    if (local.length > 0) {
      await supabase
        .from('custom_categories')
        .insert(local.map((c) => catToRow(userId, c)));
    }
  }

  return true;
}

// ── Full push (dirty-flag recovery) ───────────────────────────────────────────

export async function pushAllCustomCats(userId: string): Promise<boolean> {
  try {
    const local = useScheduleStore.getState().customCategories;
    if (local.length === 0) return true;
    const { error } = await supabase
      .from('custom_categories')
      .upsert(local.map((c) => catToRow(userId, c)));
    if (error) { await markSyncDirty(); return false; }
    return true;
  } catch {
    await markSyncDirty();
    return false;
  }
}

// ── Individual mutations ──────────────────────────────────────────────────────

export async function upsertCustomCat(userId: string, cat: CustomCategory): Promise<void> {
  try {
    const { error } = await supabase.from('custom_categories').upsert(catToRow(userId, cat));
    if (error) await markSyncDirty();
  } catch { await markSyncDirty(); }
}

export async function deleteCustomCatRemote(userId: string, catId: string): Promise<void> {
  try {
    const { error } = await supabase.from('custom_categories').delete().eq('user_id', userId).eq('id', catId);
    if (error) await markSyncDirty();
  } catch { await markSyncDirty(); }
}
