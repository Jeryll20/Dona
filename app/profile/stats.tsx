import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { CAT } from '@/constants/categories';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { CatKey, WeekDay, UserActivity } from '@/types';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEK_DAYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_LABELS: Record<WeekDay, string> = {
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mer', Thu: 'Jeu',
  Fri: 'Ven', Sat: 'Sam', Sun: 'Dim',
};

const CAT_LABELS: Partial<Record<CatKey, string>> = {
  travail:  'Travail',
  activite: 'Sport & activités',
  trajet:   'Trajets',
  repas:    'Repas',
  prep:     'Préparation',
  sommeil:  'Sommeil',
};

function parseH(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

function duration(a: UserActivity): number {
  return Math.max(0, parseH(a.endTime) - parseH(a.startTime));
}

function fmtH(h: number): string {
  if (h === 0) return '0h';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (mm === 0) return `${hh}h`;
  if (hh === 0) return `${mm} min`;
  return `${hh}h${mm}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, bg }: {
  label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <View style={[card.wrap, { backgroundColor: bg }]}>
      <Text style={[card.value, { color }]}>{value}</Text>
      <Text style={[card.label, { color }]}>{label}</Text>
      <Text style={[card.sub, { color }]}>{sub}</Text>
    </View>
  );
}

const card = StyleSheet.create({
  wrap:  { flex: 1, borderRadius: Radius.block, padding: Spacing.base, gap: 2, ...Shadow.sm },
  value: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: FontSize.sm, fontWeight: '700', opacity: 0.8 },
  sub:   { fontSize: FontSize.xs, fontWeight: '500', opacity: 0.6 },
});

function CategoryBar({ cat, hours, max }: { cat: CatKey; hours: number; max: number }) {
  const c = CAT[cat] ?? { bg: Colors.light.surfaceSunk, ink: Colors.light.ink3 };
  const filled = max > 0 ? hours / max : 0;
  return (
    <View style={bar.row}>
      <View style={[bar.dot, { backgroundColor: c.ink }]} />
      <Text style={bar.label}>{CAT_LABELS[cat] ?? cat}</Text>
      <View style={bar.track}>
        <View style={{ flex: filled, height: 8, backgroundColor: c.ink, borderRadius: 4 }} />
        <View style={{ flex: 1 - filled }} />
      </View>
      <Text style={bar.value}>{fmtH(hours)}/sem</Text>
    </View>
  );
}

function DayBar({ day, hours, max }: { day: WeekDay; hours: number; max: number }) {
  const filled = max > 0 ? hours / max : 0;
  return (
    <View style={bar.row}>
      <Text style={[bar.label, { width: 30 }]}>{DAY_LABELS[day]}</Text>
      <View style={bar.track}>
        <View style={{ flex: filled, height: 8, backgroundColor: Colors.light.primary, borderRadius: 4 }} />
        <View style={{ flex: 1 - filled }} />
      </View>
      <Text style={bar.value}>{fmtH(hours)}</Text>
    </View>
  );
}

const bar = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  dot:   { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.ink2, width: 100 },
  track: { flex: 1, height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  value: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.ink3, width: 60, textAlign: 'right' },
});

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[info.row, !last && info.border]}>
      <Text style={info.label}>{label}</Text>
      <Text style={info.value}>{value}</Text>
    </View>
  );
}

const info = StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.base },
  border: { borderBottomWidth: 1, borderBottomColor: Colors.light.hairline },
  label:  { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink2 },
  value:  { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { sleep, meals } = useUserStore();
  const activities = useScheduleStore((s) => s.activities);

  // Weekly hours per category (sum of duration × days/week for each activity)
  const weeklyByCategory = useMemo(() => {
    const totals: Partial<Record<CatKey, number>> = {};
    for (const a of activities) {
      const dur = duration(a);
      totals[a.cat] = (totals[a.cat] ?? 0) + dur * a.days.length;
    }
    return Object.entries(totals).sort(([, a], [, b]) => b - a) as [CatKey, number][];
  }, [activities]);

  // Total planned activity hours per week
  const totalActivityH = weeklyByCategory.reduce((s, [, h]) => s + h, 0);

  // Daily scheduled hours (fixed profile events + user activities)
  const dailyHours = useMemo(() => {
    const sleepH   = sleep.sleepHours  ?? 8;
    const prepH    = (sleep.prepMinutes ?? 40) / 60;
    const mealsH   = (meals.entries?.length ?? 3) * 0.5;
    const baseH    = sleepH + prepH + mealsH;

    const map = {} as Record<WeekDay, number>;
    for (const day of WEEK_DAYS) {
      let total = baseH;
      for (const a of activities) {
        if (a.days.includes(day)) total += duration(a);
      }
      map[day] = total;
    }
    return map;
  }, [activities, sleep, meals]);

  const maxDailyH = Math.max(...Object.values(dailyHours), 1);
  const maxCatH   = Math.max(...weeklyByCategory.map(([, h]) => h), 1);

  const mealEntries = meals.entries ?? meals.times?.map((t) => ({ time: t })) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Statistiques</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top cards ─────────────────────────────────────────────────────── */}
        <View style={styles.cards}>
          <StatCard
            label="Sommeil"
            value={`${sleep.sleepHours ?? 8}h`}
            sub="par nuit"
            color={Colors.light.sleepInk}
            bg={Colors.light.sleepBg}
          />
          <StatCard
            label="Activités"
            value={String(activities.length)}
            sub="planifiées"
            color={Colors.light.primary}
            bg={Colors.light.primaryTint}
          />
          <StatCard
            label="Semaine"
            value={fmtH(Math.round(totalActivityH))}
            sub="d'activités"
            color={Colors.light.activityInk}
            bg={Colors.light.activityBg}
          />
        </View>

        {/* ── Répartition par catégorie ──────────────────────────────────────── */}
        {weeklyByCategory.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Répartition hebdomadaire</Text>
            <View style={styles.card}>
              {weeklyByCategory.map(([cat, hours]) => (
                <CategoryBar key={cat} cat={cat} hours={hours} max={maxCatH} />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Répartition hebdomadaire</Text>
            <View style={styles.card}>
              <Text style={styles.empty}>Aucune activité planifiée pour l'instant.</Text>
            </View>
          </>
        )}

        {/* ── Charge par jour ────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Semaine type</Text>
        <View style={styles.card}>
          {WEEK_DAYS.map((day) => (
            <DayBar key={day} day={day} hours={dailyHours[day]} max={maxDailyH} />
          ))}
        </View>

        {/* ── Sommeil ───────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Sommeil & Routine</Text>
        <View style={styles.card}>
          <InfoRow label="Coucher"      value={sleep.bedtime  ?? '—'} />
          <InfoRow label="Réveil"       value={sleep.waketime ?? '—'} />
          <InfoRow label="Durée"        value={`${sleep.sleepHours ?? 8} h`} />
          <InfoRow label="Préparation"  value={`${sleep.prepMinutes ?? 40} min`} last />
        </View>

        {/* ── Repas ─────────────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Repas</Text>
        <View style={styles.card}>
          <InfoRow label="Par jour" value={`${mealEntries.length} repas`} />
          <InfoRow
            label="Horaires"
            value={mealEntries.map((e) => e.time).filter(Boolean).join(' · ') || '—'}
            last
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, paddingTop: Spacing.sm, gap: Spacing.md },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.input,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.3 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
    marginTop: Spacing.sm,
  },
  cards: { flexDirection: 'row', gap: Spacing.sm },
  card:  {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  empty: { fontSize: FontSize.base, color: Colors.light.ink3, textAlign: 'center', paddingVertical: Spacing.lg },
});
