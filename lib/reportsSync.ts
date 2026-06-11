import { supabase } from './supabase';
import { markSyncDirty } from './syncGuard';
import type { WeeklyReport, CategoryStat, CustomCatStat, PatternInsight, CatKey } from '@/types';

// Archive of generated weekly reports — the local store only caches the
// latest one; the archive enables multi-week trend stats.

function reportToRow(userId: string, r: WeeklyReport) {
  return {
    user_id:          userId,
    week_start:       r.weekStart,
    completion_rate:  r.completionRate,
    category_stats:   r.categoryStats,
    custom_cat_stats: r.customCatStats ?? {},
    streak:           r.streak ?? 0,
    patterns:         r.patterns,
    mistral_insights: r.mistralInsights,
    generated_at:     r.generatedAt,
  };
}

function rowToReport(row: Record<string, unknown>): WeeklyReport {
  return {
    weekStart:       row.week_start       as string,
    completionRate:  row.completion_rate  as number,
    categoryStats:   (row.category_stats   as Partial<Record<CatKey, CategoryStat>> | null) ?? {},
    customCatStats:  (row.custom_cat_stats as Record<string, CustomCatStat> | null) ?? {},
    streak:          (row.streak           as number | null) ?? 0,
    patterns:        (row.patterns         as PatternInsight[] | null) ?? [],
    mistralInsights: (row.mistral_insights as string | null) ?? '',
    generatedAt:     row.generated_at      as string,
  };
}

/** Fire-and-forget: archives (or refreshes) the report for its week. */
export async function upsertWeeklyReport(userId: string, report: WeeklyReport): Promise<void> {
  try {
    const { error } = await supabase
      .from('weekly_reports')
      .upsert(reportToRow(userId, report), { onConflict: 'user_id,week_start' });
    if (error) await markSyncDirty();
  } catch { await markSyncDirty(); }
}

/** Most recent reports first — for multi-week trend stats. */
export async function fetchWeeklyReports(userId: string, limit = 8): Promise<WeeklyReport[]> {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((r) => rowToReport(r as Record<string, unknown>));
  } catch {
    return [];
  }
}
