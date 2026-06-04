import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useUserStore } from '@/store/useUserStore';
import { scheduleAllNotifications } from '@/lib/notifications';
import { buildDefaultDay } from '@/lib/optimizer';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import type { TimelineEvent } from '@/types';

function fmtHour(h: number) {
  const hh = Math.floor(h) % 24;
  const mm = Math.round((h - Math.floor(h)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function buildDayFromProfile(
  sleep: ReturnType<typeof useUserStore.getState>['sleep'],
  meals?: ReturnType<typeof useUserStore.getState>['meals'],
): TimelineEvent[] {
  return buildDefaultDay(
    {
      bedtime:     sleep.bedtime     ?? '23:00',
      waketime:    sleep.waketime    ?? '07:00',
      prepMinutes: sleep.prepMinutes ?? 40,
    },
    meals,
  );
}

const HH = 44; // px per hour in the recap preview

export default function RecapScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { sleep, meals, cycle } = useUserStore();
  const completeOnboarding = useUserStore((st) => st.completeOnboarding);

  const events = buildDayFromProfile(sleep, meals);

  function handleStart() {
    completeOnboarding();
    scheduleAllNotifications({
      events,
      cycleTracking:  cycle.tracking ?? false,
      lastPeriodDate: cycle.lastPeriodDate,
      cycleDays:      cycle.cycleDays,
    });
    router.replace('/(tabs)/' as any);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Ta journée type</Text>
        <Text style={s.sub}>
          Voici un aperçu de ton planning optimisé. Tu pourras tout modifier à tout moment.
        </Text>

        <View style={[s.preview, { height: 16 * HH }]}>
          {events.map((ev, i) => {
            const c      = CAT[ev.cat];
            const top    = Math.max(0, ev.start - 6) * HH;
            const height = Math.max((ev.end - ev.start) * HH, 16);
            if (ev.start < 6 || ev.start > 22) return null;
            return (
              <View key={i} style={[s.block, { top, height, backgroundColor: c.bg }]}
                accessibilityLabel={ev.title}>
                <Text style={[s.blockTitle, { color: c.ink }]}>{ev.title}</Text>
                {height > 36 && (
                  <Text style={[s.blockTime, { color: c.ink }]}>
                    {fmtHour(ev.start)} – {fmtHour(ev.end)}
                  </Text>
                )}
              </View>
            );
          })}
          {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
            <View key={h} style={[s.hourRow, { top: (h - 6) * HH }]}>
              <Text style={s.hourLabel}>{String(h).padStart(2, '0')}h</Text>
              <View style={s.hourLine} />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton onPress={handleStart}>C'est parti !</PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:    { flex: 1, backgroundColor: C.background },
    scroll:  { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, paddingTop: Spacing.xl, gap: Spacing.xl },

    title: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.6 },
    sub:   { fontSize: FontSize.base, color: C.ink2, lineHeight: 22 },

    preview: { position: 'relative', paddingLeft: 46, marginHorizontal: -Spacing.lg + Spacing.base },

    hourRow:   { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
    hourLabel: { width: 38, textAlign: 'right', fontSize: 10, fontWeight: '600', color: C.ink3 },
    hourLine:  { flex: 1, height: 1, backgroundColor: C.hairline, opacity: 0.7 },

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
}
