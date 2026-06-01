import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function buildDayFromProfile(sleep: ReturnType<typeof useUserStore.getState>['sleep']): TimelineEvent[] {
  const bedHour  = parseTime(sleep.bedtime  ?? '23:00');
  const wakeHour = parseTime(sleep.waketime ?? '07:00');
  const prepH    = (sleep.prepMinutes ?? 40) / 60;

  const events: TimelineEvent[] = [];

  if (bedHour > 0) events.push({ cat: 'sommeil', title: 'Sommeil',    start: 0, end: wakeHour });
  events.push({ cat: 'prep',    title: 'Préparation', start: wakeHour, end: wakeHour + prepH });
  events.push({ cat: 'travail', title: 'Travail',     start: wakeHour + prepH + 0.5, end: wakeHour + prepH + 8.5 });
  events.push({ cat: 'repas',   title: 'Déjeuner',    start: 12.5, end: 13.5 });
  events.push({ cat: 'sommeil', title: 'Sommeil',     start: bedHour, end: 24 });

  return events;
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

const HH = 44; // px per hour in the recap preview

export default function RecapScreen() {
  const sleep = useUserStore((s) => s.sleep);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setTodayEvents = useScheduleStore((s) => s.setTodayEvents);

  const events = buildDayFromProfile(sleep);

  function handleStart() {
    setTodayEvents(events);
    completeOnboarding();
    router.replace('/(tabs)/' as any);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Ta journée type</Text>
        <Text style={styles.sub}>
          Voici un aperçu de ton planning optimisé. Tu pourras tout modifier à tout moment.
        </Text>

        <View style={[styles.preview, { height: 16 * HH }]}>
          {events.map((ev, i) => {
            const c      = CAT[ev.cat];
            const top    = Math.max(0, ev.start - 6) * HH;
            const height = Math.max((ev.end - ev.start) * HH, 16);
            if (ev.start < 6 || ev.start > 22) return null;
            return (
              <View key={i} style={[styles.block, { top, height, backgroundColor: c.bg }]}
                accessibilityLabel={ev.title}>
                <Text style={[styles.blockTitle, { color: c.ink }]}>{ev.title}</Text>
                {height > 36 && (
                  <Text style={[styles.blockTime, { color: c.ink }]}>
                    {fmtHour(ev.start)} – {fmtHour(ev.end)}
                  </Text>
                )}
              </View>
            );
          })}
          {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
            <View key={h} style={[styles.hourRow, { top: (h - 6) * HH }]}>
              <Text style={styles.hourLabel}>{String(h).padStart(2, '0')}h</Text>
              <View style={styles.hourLine} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton onPress={handleStart}>C'est parti !</PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.light.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, paddingTop: Spacing.xl, gap: Spacing.xl },

  title: { fontSize: 28, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.6 },
  sub:   { fontSize: FontSize.base, color: Colors.light.ink2, lineHeight: 22 },

  preview: { position: 'relative', paddingLeft: 46, marginHorizontal: -Spacing.lg + Spacing.base },

  hourRow:   { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
  hourLabel: { width: 38, textAlign: 'right', fontSize: 10, fontWeight: '600', color: Colors.light.ink3 },
  hourLine:  { flex: 1, height: 1, backgroundColor: Colors.light.hairline, opacity: 0.7 },

  block: {
    position: 'absolute',
    left: 48,
    right: 4,
    borderRadius: 12,
    padding: Spacing.sm,
    overflow: 'hidden',
  },
  blockTitle: { fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },
  blockTime:  { fontSize: 11, fontWeight: '600', opacity: 0.8, marginTop: 2 },

  footer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.md },
});
