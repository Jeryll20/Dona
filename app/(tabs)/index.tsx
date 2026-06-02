import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Icon } from '@/components/ui/Icon';
import { HourGrid } from '@/components/timeline/HourGrid';
import { NowIndicator } from '@/components/timeline/NowIndicator';
import { TimelineBlock } from '@/components/timeline/TimelineBlock';
import { ThinBlock } from '@/components/timeline/ThinBlock';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useSuggestionsStore } from '@/store/useSuggestionsStore';
import { buildSuggestions, buildDefaultDay } from '@/lib/optimizer';
import { getCyclePhase } from '@/lib/cycle';
import type { TimelineEvent, WeekDay } from '@/types';

const DAY_MAP: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

export const HH = 58;
const LEFT_OFFSET = 52;


function scheduledHours(events: TimelineEvent[]) {
  return events.filter((e) => !e.thin).reduce((sum, e) => sum + (e.end - e.start), 0);
}

const PHASE_LABEL: Record<string, string> = {
  menstrual:  'Phase Menstruelle',
  follicular: 'Phase Folliculaire',
  ovulation:  'Ovulation',
  luteal:     'Phase Lutéale',
};

const PHASE_COLOR: Record<string, string> = {
  menstrual:  '#C0533A',
  follicular: '#5A52A0',
  ovulation:  '#524FB5',
  luteal:     '#3A8A50',
};

export default function TodayScreen() {
  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;

  const { sleep, meals, work, cycle } = useUserStore();
  const activities = useScheduleStore((s) => s.activities);
  const { suggestions, setSuggestions, acceptSuggestion, dismissSuggestion, lastGeneratedAt } =
    useSuggestionsStore();

  const todayKey = DAY_MAP[new Date().getDay()];

  // Base day events derived directly from user profile
  const baseEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDefaultDay(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep.waketime, sleep.bedtime, sleep.prepMinutes, meals]);

  // User-added activities scheduled for today
  const activityEvents = useMemo<TimelineEvent[]>(() => (
    activities
      .filter((a) => a.days.includes(todayKey))
      .map((a) => ({
        cat:   a.cat,
        title: a.title,
        start: parseTime(a.startTime),
        end:   parseTime(a.endTime),
      }))
  ), [activities, todayKey]);

  // Merge and sort all events
  const events = useMemo<TimelineEvent[]>(
    () => [...baseEvents, ...activityEvents].sort((a, b) => a.start - b.start),
    [baseEvents, activityEvents],
  );

  const cyclePhase = useMemo(() => {
    if (!cycle.tracking || !cycle.lastPeriodDate) return undefined;
    return getCyclePhase(cycle.lastPeriodDate, cycle.cycleDays ?? 28);
  }, [cycle.tracking, cycle.lastPeriodDate, cycle.cycleDays]);

  // Regenerate suggestions once per calendar day or when inputs change
  useEffect(() => {
    const today = new Date().toDateString();
    const alreadyToday = lastGeneratedAt
      ? new Date(lastGeneratedAt).toDateString() === today
      : false;
    if (!alreadyToday) {
      setSuggestions(buildSuggestions({ events, goal: work.role ?? undefined, cyclePhase }));
    }
  }, [events, work.role, cyclePhase]);

  const visibleSuggestions = suggestions.filter((s) => !s.accepted && !s.dismissed);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel} accessibilityLabel="Date du jour">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={styles.title}>Aujourd'hui</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {Math.round(scheduledHours(events))}h planifiées
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => router.push('/chat' as any)}
            accessibilityLabel="Ouvrir le chat Dona"
            accessibilityRole="button"
          >
            <Icon name="spark" size={20} stroke={Colors.light.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cycle phase mini-badge */}
      {cyclePhase && (
        <View style={[styles.phaseBadge, { borderColor: PHASE_COLOR[cyclePhase] }]}>
          <View style={[styles.phaseDot, { backgroundColor: PHASE_COLOR[cyclePhase] }]} />
          <Text style={[styles.phaseText, { color: PHASE_COLOR[cyclePhase] }]}>
            {PHASE_LABEL[cyclePhase]}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentOffset={{ x: 0, y: 6 * HH }}
      >
        {/* Suggestions */}
        {visibleSuggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionLabel}>Suggestions pour toi</Text>
            {visibleSuggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAccept={() => acceptSuggestion(s.id)}
                onDismiss={() => dismissSuggestion(s.id)}
              />
            ))}
          </View>
        )}

        {/* Timeline */}
        <View style={[styles.grid, { minHeight: 24 * HH }]}>
          <HourGrid hourHeight={HH} />
          <NowIndicator nowHour={nowHour} hourHeight={HH} />
          {events.map((ev, i) =>
            ev.thin
              ? <ThinBlock    key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} />
              : <TimelineBlock key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  dateLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.primaryStrong,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  badge: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadow.sm,
  },
  badgeText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.ink2 },

  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    backgroundColor: Colors.light.surface,
  },
  phaseDot:  { width: 7, height: 7, borderRadius: 4 },
  phaseText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },

  suggestionsSection: { marginBottom: Spacing.lg, gap: Spacing.xs },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },

  grid: { position: 'relative', paddingLeft: 50 },
});
