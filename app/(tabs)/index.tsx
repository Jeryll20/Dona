import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  PanResponder, Animated, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState, useRef } from 'react';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Icon } from '@/components/ui/Icon';
import { HourGrid } from '@/components/timeline/HourGrid';
import { NowIndicator } from '@/components/timeline/NowIndicator';
import { TimelineBlock } from '@/components/timeline/TimelineBlock';
import { ThinBlock } from '@/components/timeline/ThinBlock';
import { WeekView } from '@/components/timeline/WeekView';
import { MonthView } from '@/components/timeline/MonthView';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useSuggestionsStore } from '@/store/useSuggestionsStore';
import { buildSuggestions, buildDefaultDay } from '@/lib/optimizer';
import { getCyclePhase } from '@/lib/cycle';
import type { TimelineEvent, WeekDay } from '@/types';

const DAY_MAP: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayTitle(offset: number): string {
  if (offset === 0) return "Aujourd'hui";
  if (offset === -1) return 'Hier';
  if (offset === 1) return 'Demain';
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const label = d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const PROFILE_TARGET: Partial<Record<string, string>> = {
  sommeil: '/profile/sleep',
  prep:    '/profile/sleep',
  repas:   '/profile/meals',
};

function getEventPress(
  ev: TimelineEvent & { activityId?: string },
): (() => void) | undefined {
  if (ev.activityId) {
    return () => router.navigate({
      pathname: '/(tabs)/activities',
      params: { editId: ev.activityId },
    } as any);
  }
  const path = PROFILE_TARGET[ev.cat];
  return path ? () => router.push(path as any) : undefined;
}

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

  const [dayOffset, setDayOffset] = useState(0);

  const { width } = useWindowDimensions();
  const widthRef  = useRef(width);
  widthRef.current = width;
  const slideX = useRef(new Animated.Value(0)).current;

  const { sleep, meals, work, cycle } = useUserStore();
  const activities  = useScheduleStore((s) => s.activities);
  const viewMode    = useScheduleStore((s) => s.viewMode);
  const { suggestions, setSuggestions, acceptSuggestion, dismissSuggestion, lastGeneratedAt } =
    useSuggestionsStore();

  const selectedDate    = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);
  const selectedWeekDay = DAY_MAP[selectedDate.getDay()];

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 20,
      onPanResponderMove: (_, { dx }) => slideX.setValue(dx),
      onPanResponderRelease: (_, { dx, vx }) => {
        const w = widthRef.current;
        if (dx > 70 || vx > 0.5) {
          Animated.timing(slideX, { toValue: w, duration: 150, useNativeDriver: true }).start(() => {
            setDayOffset((o) => o - 1);
            slideX.setValue(-w);
            Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          });
        } else if (dx < -70 || vx < -0.5) {
          Animated.timing(slideX, { toValue: -w, duration: 150, useNativeDriver: true }).start(() => {
            setDayOffset((o) => o + 1);
            slideX.setValue(w);
            Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
          });
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const slideDay = (direction: 'prev' | 'next') => {
    const w    = widthRef.current;
    const outX = direction === 'prev' ? w : -w;
    const inX  = direction === 'prev' ? -w : w;
    Animated.timing(slideX, { toValue: outX, duration: 150, useNativeDriver: true }).start(() => {
      setDayOffset((o) => direction === 'prev' ? o - 1 : o + 1);
      slideX.setValue(inX);
      Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };

  // Base day events derived directly from user profile
  const baseEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDefaultDay(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep.waketime, sleep.bedtime, sleep.prepMinutes, meals]);

  // User-added activities scheduled for today (keep activityId for navigation)
  const activityEvents = useMemo<(TimelineEvent & { activityId: string })[]>(() => (
    activities
      .filter((a) => a.days.includes(selectedWeekDay))
      .map((a) => ({
        cat:        a.cat,
        title:      a.title,
        start:      parseTime(a.startTime),
        end:        parseTime(a.endTime),
        activityId: a.id,
      }))
  ), [activities, selectedWeekDay]);

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
      <View style={{ flex: 1 }} {...(viewMode === 'day' ? swipe.panHandlers : {})}>
      <View style={styles.header}>
        <View>
          <Text style={styles.dateLabel} accessibilityLabel="Date du jour">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <View style={styles.titleRow}>
            <TouchableOpacity
              onPress={() => slideDay('prev')}
              style={styles.navArrow}
              accessibilityLabel="Jour précédent"
              accessibilityRole="button"
            >
              <Icon name="back" size={16} stroke={Colors.light.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{getDayTitle(dayOffset)}</Text>
            <TouchableOpacity
              onPress={() => slideDay('next')}
              style={styles.navArrow}
              accessibilityLabel="Jour suivant"
              accessibilityRole="button"
            >
              <Icon name="arrow" size={16} stroke={Colors.light.primary} />
            </TouchableOpacity>
          </View>
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
            <Icon name="chat" size={20} stroke={Colors.light.primary} />
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

      {viewMode === 'week'  && <WeekView />}
      {viewMode === 'month' && <MonthView />}
      {viewMode === 'day'   && (
        <Animated.View style={[{ flex: 1 }, { transform: [{ translateX: slideX }] }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentOffset={{ x: 0, y: 6 * HH }}
        >
          {/* Suggestions — today only */}
          {dayOffset === 0 && visibleSuggestions.length > 0 && (
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
            {dayOffset === 0 && <NowIndicator nowHour={nowHour} hourHeight={HH} />}
            {events.map((ev, i) =>
              ev.thin
                ? <ThinBlock     key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} onPress={getEventPress(ev as any)} />
                : <TimelineBlock key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} onPress={getEventPress(ev as any)} />
            )}
          </View>
        </ScrollView>
        </Animated.View>
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  navArrow: {
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.5,
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
