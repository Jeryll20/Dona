import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  PanResponder, useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef } from 'react';
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
import { buildSuggestions, buildDayEvents } from '@/lib/optimizer';
import { getCyclePhase } from '@/lib/cycle';
import type { TimelineEvent, WeekDay, UserActivity, Suggestion } from '@/types';
import type { ViewMode } from '@/store/useScheduleStore';

const DAY_MAP: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'day',   label: 'Jour' },
  { key: 'week',  label: 'Sem'  },
  { key: 'month', label: 'Mois' },
];

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
    return () => router.navigate({ pathname: '/(tabs)/activities', params: { editId: ev.activityId } } as any);
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

// ─── Single day panel (prev / current / next) ─────────────────────────────────

interface DayPanelProps {
  absOffset: number;
  sleep: ReturnType<typeof useUserStore.getState>['sleep'];
  meals: ReturnType<typeof useUserStore.getState>['meals'];
  activities: UserActivity[];
  visibleSuggestions: Suggestion[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  nowHour: number;
  panelWidth: number;
}

function DayPanel({
  absOffset, sleep, meals,
  activities, visibleSuggestions, onAccept, onDismiss, nowHour, panelWidth,
}: DayPanelProps) {
  const d = new Date();
  d.setDate(d.getDate() + absOffset);
  const weekDay = DAY_MAP[d.getDay()];
  const isToday = absOffset === 0;

  const profileEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDayEvents(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep, meals]);

  const activityEvents = useMemo<(TimelineEvent & { activityId: string })[]>(() => (
    activities
      .filter((a) => a.days.includes(weekDay))
      .map((a) => ({
        cat:        a.cat,
        title:      a.title,
        start:      parseTime(a.startTime),
        end:        parseTime(a.endTime),
        activityId: a.id,
        color:      a.color,
      }))
  ), [activities, weekDay]);

  const events = useMemo<TimelineEvent[]>(
    () => [...profileEvents, ...activityEvents].sort((a, b) => a.start - b.start),
    [profileEvents, activityEvents],
  );

  return (
    <ScrollView
      style={{ width: panelWidth, flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: 6 * HH }}
    >
      {isToday && visibleSuggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionLabel}>Suggestions pour toi</Text>
          {visibleSuggestions.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              onAccept={() => onAccept(s.id)}
              onDismiss={() => onDismiss(s.id)}
            />
          ))}
        </View>
      )}
      <View style={[styles.grid, { minHeight: 24 * HH }]}>
        <HourGrid hourHeight={HH} />
        {isToday && <NowIndicator nowHour={nowHour} hourHeight={HH} />}
        {events.map((ev, i) =>
          ev.thin
            ? <ThinBlock     key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} onPress={getEventPress(ev as any)} />
            : <TimelineBlock key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} onPress={getEventPress(ev as any)} />
        )}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

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

  const { width } = useWindowDimensions();
  const widthRef  = useRef(width);
  widthRef.current = width;
  // slideX = -width means center panel (current day) is visible
  const slideX      = useSharedValue(-width);
  const slideStartX = useRef(-width);

  const { sleep, meals, cycle, profile } = useUserStore();
  const activities   = useScheduleStore((s) => s.activities);
  const viewMode     = useScheduleStore((s) => s.viewMode);
  const setViewMode  = useScheduleStore((s) => s.setViewMode);
  const dayOffset    = useScheduleStore((s) => s.dayOffset);
  const setDayOffset = useScheduleStore((s) => s.setDayOffset);
  const { suggestions, setSuggestions, acceptSuggestion, dismissSuggestion, lastGeneratedAt } =
    useSuggestionsStore();

  const selectedDate    = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);
  const selectedWeekDay = DAY_MAP[selectedDate.getDay()];

  function goPrevDay() {
    slideX.value = -widthRef.current;
    setDayOffset((o: number) => o - 1);
  }
  function goNextDay() {
    slideX.value = -widthRef.current;
    setDayOffset((o: number) => o + 1);
  }

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 20,
      onPanResponderGrant: () => {
        cancelAnimation(slideX);
        slideStartX.current = slideX.value;
      },
      onPanResponderMove: (_, { dx }) => {
        slideX.value = slideStartX.current + dx;
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const w = widthRef.current;
        if (dx > 70 || vx > 0.5) {
          slideX.value = withTiming(0, { duration: 280 }, () => {
            runOnJS(goPrevDay)();
          });
        } else if (dx < -70 || vx < -0.5) {
          slideX.value = withTiming(-2 * w, { duration: 280 }, () => {
            runOnJS(goNextDay)();
          });
        } else {
          slideX.value = withSpring(-w, { damping: 22, mass: 0.9, stiffness: 200 });
        }
      },
      onPanResponderTerminate: () => {
        slideX.value = withSpring(-widthRef.current, { damping: 22, mass: 0.9, stiffness: 200 });
      },
    })
  ).current;

  const slideDay = (direction: 'prev' | 'next') => {
    const w = widthRef.current;
    if (direction === 'prev') {
      slideX.value = withTiming(0, { duration: 280 }, () => {
        runOnJS(goPrevDay)();
      });
    } else {
      slideX.value = withTiming(-2 * w, { duration: 280 }, () => {
        runOnJS(goNextDay)();
      });
    }
  };

  // Today's events for suggestion generation (profile + user activities, day-aware)
  const todayProfileEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDayEvents(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep, meals]);

  const todayActivityEvents = useMemo(() => (
    activities
      .filter((a) => a.days.includes(selectedWeekDay))
      .map((a) => ({ cat: a.cat, title: a.title, start: parseTime(a.startTime), end: parseTime(a.endTime) }))
  ), [activities, selectedWeekDay]);

  const todayEvents = useMemo<TimelineEvent[]>(
    () => [...todayProfileEvents, ...todayActivityEvents].sort((a, b) => a.start - b.start),
    [todayProfileEvents, todayActivityEvents],
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
      setSuggestions(buildSuggestions({ events: todayEvents, goal: profile.goal ?? undefined, cyclePhase }));
    }
  }, [todayEvents, profile.goal, cyclePhase]);

  const visibleSuggestions = suggestions.filter((s) => !s.accepted && !s.dismissed);

  const panelsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // Reset slideX when entering day view from week/month (stop any in-flight animation)
  useEffect(() => {
    if (viewMode === 'day') {
      cancelAnimation(slideX);
      slideX.value = -width;
    }
  }, [viewMode]);

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
            <Icon name="clock" size={14} stroke={Colors.light.ink2} />
            <Text style={styles.badgeText}>
              {Math.round(scheduledHours(todayEvents))}h planifiées
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

      {/* View mode pills */}
      <View style={styles.modeRow}>
        {VIEW_MODES.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[styles.modePill, viewMode === v.key && styles.modePillActive]}
            onPress={() => setViewMode(v.key)}
            accessibilityRole="button"
            accessibilityLabel={v.label}
            accessibilityState={{ selected: viewMode === v.key }}
          >
            <Text style={[styles.modePillText, viewMode === v.key && styles.modePillTextActive]}>
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
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
      {viewMode === 'day' && (
        <View style={styles.dayClipper}>
          <Animated.View
            style={[styles.dayPanels, { width: width * 3 }, panelsStyle]}
          >
            {[dayOffset - 1, dayOffset, dayOffset + 1].map((off) => (
              <DayPanel
                key={off}
                absOffset={off}
                sleep={sleep}
                meals={meals}
                activities={activities}
                visibleSuggestions={visibleSuggestions}
                onAccept={acceptSuggestion}
                onDismiss={dismissSuggestion}
                nowHour={nowHour}
                panelWidth={width}
              />
            ))}
          </Animated.View>
        </View>
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
    paddingHorizontal: 22,
    paddingBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 8,
    ...Shadow.sm,
  },
  badgeText: { fontSize: 13.5, fontWeight: '600', color: Colors.light.ink2 },

  modeRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.pill,
    padding: 2,
    marginBottom: Spacing.sm,
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  modePillActive: {
    backgroundColor: Colors.light.primary,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink3,
  },
  modePillTextActive: {
    color: Colors.light.onPrimary,
    fontWeight: '700',
  },

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

  dayClipper: {
    flex: 1,
    overflow: 'hidden',
  },
  dayPanels: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
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
