import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  PanResponder, useWindowDimensions, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLOR_PALETTE } from '@/constants/Colors';
import { useColors } from '@/hooks/useColors';
import { CAT } from '@/constants/categories';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { TimeField } from '@/components/ui/TimeField';
import { ThinBlock } from '@/components/timeline/ThinBlock';
import { HourGrid } from '@/components/timeline/HourGrid';
import { NowIndicator } from '@/components/timeline/NowIndicator';
import { TimelineBlock } from '@/components/timeline/TimelineBlock';
import { WeekView } from '@/components/timeline/WeekView';
import { MonthView } from '@/components/timeline/MonthView';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSuggestionsStore } from '@/store/useSuggestionsStore';
import { upsertOverride, deleteOverrideRemote, upsertActivity } from '@/lib/activitiesSync';
import { upsertCompletion, deleteCompletionRemote } from '@/lib/completionsSync';
import { buildSuggestions, buildDayEvents } from '@/lib/optimizer';
import { isActivityVisibleOn, toLocalISODate } from '@/lib/recurrence';
import { genId } from '@/lib/id';
import { getCyclePhase } from '@/lib/cycle';
import { useBehaviorStore } from '@/store/useBehaviorStore';
import type { TimelineEvent, WeekDay, UserActivity, Suggestion, ActivityOverride } from '@/types';
import type { ViewMode } from '@/store/useScheduleStore';

const DAY_MAP: WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  day: 'Jour', week: 'Semaine', month: 'Mois',
};
const VIEW_MODE_ORDER: ViewMode[] = ['day', 'week', 'month'];

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

function profileEventPress(ev: TimelineEvent): (() => void) | undefined {
  const path = PROFILE_TARGET[ev.cat];
  return path ? () => router.push(path as any) : undefined;
}

function offsetToDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toLocalISODate(d); // local — toISOString() returns the previous day before 1-2am French time
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

function hourToHHMM(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export const HH = 58;
const LEFT_OFFSET = 52;

// ─── Single day panel (prev / current / next) ─────────────────────────────────

interface DayPanelProps {
  absOffset: number;
  sleep: ReturnType<typeof useUserStore.getState>['sleep'];
  meals: ReturnType<typeof useUserStore.getState>['meals'];
  activities: UserActivity[];
  overrides: ActivityOverride[];
  onActivityPress: (activityId: string, date: string, isRecurring: boolean) => void;
  onActivityLongPress: (activityId: string, date: string) => void;
  visibleSuggestions: Suggestion[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  nowHour: number;
  panelWidth: number;
}

function DayPanel({
  absOffset, sleep, meals,
  activities, overrides, onActivityPress, onActivityLongPress,
  visibleSuggestions, onAccept, onDismiss, nowHour, panelWidth,
}: DayPanelProps) {
  const C = useColors();
  const s = makeStyles(C);
  const completions      = useBehaviorStore((st) => st.completions);
  const customCategories = useScheduleStore((st) => st.customCategories);
  const d = new Date();
  d.setDate(d.getDate() + absOffset);
  const weekDay = DAY_MAP[d.getDay()];
  const dateStr = toLocalISODate(d);
  const isToday = absOffset === 0;

  const profileEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDayEvents(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep, meals]);

  const activityEvents = useMemo<(TimelineEvent & { activityId?: string })[]>(() => {
    const getOverride = (id: string) =>
      overrides.find((o) => o.activityId === id && o.date === dateStr);

    const result: (TimelineEvent & { activityId?: string })[] = [];

    for (const a of activities) {
      if (!isActivityVisibleOn(a, dateStr)) continue;
      const ov = getOverride(a.id);
      if (ov?.cancelled) continue;

      const start = parseTime(ov?.startTime ?? a.startTime);
      const end   = parseTime(ov?.endTime   ?? a.endTime);
      const title = ov?.title ?? a.title;

      // Auto-insert trajet block before the activity
      if (a.trajetMinutesBefore && a.trajetMinutesBefore > 0) {
        const trajetH = a.trajetMinutesBefore / 60;
        result.push({
          cat:   'trajet',
          title: `Trajet → ${title}`,
          start: Math.max(0, start - trajetH),
          end:   start,
          thin:  true,
          dur:   `${a.trajetMinutesBefore} min`,
        });
      }

      result.push({
        cat:        a.cat,
        title,
        start,
        end,
        activityId: a.id,
        color:      ov?.color ?? a.color ?? (a.customCatId
          ? customCategories.find((c) => c.id === a.customCatId)?.color
          : undefined),
      });
    }

    return result;
  }, [activities, overrides, weekDay, dateStr]);

  const events = useMemo<TimelineEvent[]>(
    () => [...profileEvents, ...activityEvents].sort((a, b) => a.start - b.start),
    [profileEvents, activityEvents],
  );

  function getPressHandler(ev: TimelineEvent & { activityId?: string }) {
    if (ev.activityId) {
      const activity = activities.find((a) => a.id === ev.activityId);
      const isRecurring = activity ? activity.recurrence !== 'none' : false;
      return () => onActivityPress(ev.activityId!, dateStr, isRecurring);
    }
    return profileEventPress(ev);
  }

  return (
    <ScrollView
      style={{ width: panelWidth, flex: 1 }}
      contentContainerStyle={s.scrollContent}
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: 6 * HH }}
    >
      {isToday && visibleSuggestions.length > 0 && (
        <View style={s.suggestionsSection}>
          <Text style={s.sectionLabel}>Suggestions pour toi</Text>
          {visibleSuggestions.map((sg) => (
            <SuggestionCard
              key={sg.id}
              suggestion={sg}
              onAccept={() => onAccept(sg.id)}
              onDismiss={() => onDismiss(sg.id)}
            />
          ))}
        </View>
      )}
      <View style={[s.grid, { minHeight: 24 * HH }]}>
        <HourGrid hourHeight={HH} />
        {isToday && <NowIndicator nowHour={nowHour} hourHeight={HH} />}
        {events.filter((ev) => ev.thin).map((ev, i) => (
          <ThinBlock
            key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET}
            onPress={getPressHandler(ev as any)}
          />
        ))}
        {events.filter((ev) => !ev.thin).map((ev, i) => {
          const aev = ev as TimelineEvent & { activityId?: string };
          const comp = aev.activityId
            ? completions.find((c) => c.activityId === aev.activityId && c.date === dateStr)
            : undefined;
          return (
            <TimelineBlock
              key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET}
              onPress={getPressHandler(aev)}
              onLongPress={aev.activityId ? () => onActivityLongPress(aev.activityId!, dateStr) : undefined}
              completion={comp ? (comp.completed ? 'done' : 'skipped') : null}
            />
          );
        })}
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
  const C = useColors();
  const s = makeStyles(C);
  const sh = makeSheetStyles(C);

  // Re-render every minute so the "now" indicator moves and the date rolls
  // over at midnight (suggestions, day panels)
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowHour  = now.getHours() + now.getMinutes() / 60;
  const todayStr = toLocalISODate(now);

  const { width } = useWindowDimensions();
  const widthRef  = useRef(width);
  widthRef.current = width;
  // slideX = -width means center panel (current day) is visible
  const slideX      = useSharedValue(-width);
  const slideStartX = useRef(-width);

  const { sleep, meals, cycle, profile } = useUserStore();
  const userId       = useAuthStore((st) => st.session?.user?.id);
  const activities   = useScheduleStore((st) => st.activities);
  const addActivity  = useScheduleStore((st) => st.addActivity);
  const overrides    = useScheduleStore((st) => st.overrides);
  const setOverride  = useScheduleStore((st) => st.setOverride);
  const removeOverride = useScheduleStore((st) => st.removeOverride);
  const viewMode     = useScheduleStore((st) => st.viewMode);
  const setViewMode  = useScheduleStore((st) => st.setViewMode);
  const dayOffset    = useScheduleStore((st) => st.dayOffset);
  const setDayOffset = useScheduleStore((st) => st.setDayOffset);
  const { suggestions, setSuggestions, acceptSuggestion, dismissSuggestion,
          consumedTitles, consumedDate } = useSuggestionsStore();
  const { completions, setCompletion, removeCompletion, clearReport } = useBehaviorStore();

  // ── Completion state ──────────────────────────────────────────────────────────
  const [completionTarget, setCompletionTarget] = useState<{
    activityId: string;
    date: string;
  } | null>(null);

  const handleActivityLongPress = useCallback((activityId: string, date: string) => {
    setCompletionTarget({ activityId, date });
  }, []);

  function markCompletion(completed: boolean) {
    if (!completionTarget) return;
    const c = { activityId: completionTarget.activityId, date: completionTarget.date, completed };
    setCompletion(c);
    clearReport();
    if (userId) upsertCompletion(userId, c);
    setCompletionTarget(null);
  }

  function resetCompletion() {
    if (!completionTarget) return;
    removeCompletion(completionTarget.activityId, completionTarget.date);
    clearReport();
    if (userId) deleteCompletionRemote(userId, completionTarget.activityId, completionTarget.date);
    setCompletionTarget(null);
  }

  const completionActivity = completionTarget
    ? activities.find((a) => a.id === completionTarget.activityId)
    : null;

  const existingCompletion = completionTarget
    ? completions.find((c) => c.activityId === completionTarget.activityId && c.date === completionTarget.date)
    : undefined;

  // ── Suggestion accept state: confirm / adjust the proposed slot ──────────────
  const [suggestEdit, setSuggestEdit] = useState<{
    suggestion: Suggestion;
    startTime: string;
    endTime: string;
  } | null>(null);

  function openSuggestionAccept(id: string) {
    const sg = suggestions.find((x) => x.id === id);
    if (!sg) return;
    const start = sg.startHour ?? 18;
    setSuggestEdit({
      suggestion: sg,
      startTime: hourToHHMM(start),
      endTime:   hourToHHMM(start + sg.durationMinutes / 60),
    });
  }

  function confirmSuggestion() {
    if (!suggestEdit) return;
    const { suggestion } = suggestEdit;
    const today = new Date();
    const newActivity: UserActivity = {
      id:         genId(),
      title:      suggestion.title,
      cat:        suggestion.cat === 'sport' ? 'sport' : 'activite',
      startTime:  suggestEdit.startTime,
      endTime:    suggestEdit.endTime,
      days:       [DAY_MAP[today.getDay()]],
      recurrence: 'none',
      anchorDate: toLocalISODate(today),
    };
    addActivity(newActivity);
    clearReport(); // schedule changed → cached weekly report is stale
    if (userId) upsertActivity(userId, newActivity);
    acceptSuggestion(suggestion.id);
    setSuggestEdit(null);
  }

  // ── Single-occurrence edit state ─────────────────────────────────────────────
  const [choiceTarget, setChoiceTarget] = useState<{
    activityId: string;
    date: string;
  } | null>(null);

  const [singleEdit, setSingleEdit] = useState<{
    activityId: string;
    date: string;
    title: string;
    startTime: string;
    endTime: string;
    color?: { bg: string; ink: string };
  } | null>(null);

  const handleActivityPress = useCallback((activityId: string, date: string, isRecurring: boolean) => {
    if (!isRecurring) {
      router.navigate({ pathname: '/(tabs)/activities', params: { editId: activityId } } as any);
      return;
    }
    setChoiceTarget({ activityId, date });
  }, []);

  function openSingleEdit() {
    if (!choiceTarget) return;
    const activity = activities.find((a) => a.id === choiceTarget.activityId);
    if (!activity) return;
    const existing = overrides.find(
      (o) => o.activityId === choiceTarget.activityId && o.date === choiceTarget.date,
    );
    setSingleEdit({
      activityId: choiceTarget.activityId,
      date:       choiceTarget.date,
      title:      existing?.title      ?? activity.title,
      startTime:  existing?.startTime  ?? activity.startTime,
      endTime:    existing?.endTime    ?? activity.endTime,
      color:      existing?.color      ?? activity.color,
    });
    setChoiceTarget(null);
  }

  function cancelOccurrence() {
    if (!choiceTarget) return;
    const ov = { activityId: choiceTarget.activityId, date: choiceTarget.date, cancelled: true };
    setOverride(ov);
    clearReport();
    if (userId) upsertOverride(userId, ov);
    setChoiceTarget(null);
  }

  function saveSingleEdit() {
    if (!singleEdit) return;
    const ov = {
      activityId: singleEdit.activityId,
      date:       singleEdit.date,
      title:      singleEdit.title,
      startTime:  singleEdit.startTime,
      endTime:    singleEdit.endTime,
      color:      singleEdit.color,
    };
    setOverride(ov);
    clearReport();
    if (userId) upsertOverride(userId, ov);
    setSingleEdit(null);
  }

  const choiceActivity = choiceTarget
    ? activities.find((a) => a.id === choiceTarget.activityId)
    : null;

  const selectedDate    = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }, [dayOffset]);
  const selectedWeekDay = DAY_MAP[selectedDate.getDay()];

  function goPrevDay() {
    setDayOffset((o: number) => o - 1);
  }
  function goNextDay() {
    setDayOffset((o: number) => o + 1);
  }

  // Recenter on the new day in the SAME frame as the re-rendered panels
  // (resetting slideX inside the animation callback applied it on the UI
  // thread one frame before React committed → visible flash of the old day)
  useLayoutEffect(() => {
    cancelAnimation(slideX);
    slideX.value = -widthRef.current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayOffset]);

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
      .filter((a) => isActivityVisibleOn(a, toLocalISODate(selectedDate)))
      .map((a) => ({ cat: a.cat, title: a.title, start: parseTime(a.startTime), end: parseTime(a.endTime) }))
  ), [activities, selectedDate]);

  const todayEvents = useMemo<TimelineEvent[]>(
    () => [...todayProfileEvents, ...todayActivityEvents].sort((a, b) => a.start - b.start),
    [todayProfileEvents, todayActivityEvents],
  );

  const cyclePhase = useMemo(() => {
    if (!cycle.tracking || !cycle.lastPeriodDate) return undefined;
    return getCyclePhase(cycle.lastPeriodDate, cycle.cycleDays ?? 28);
  }, [cycle.tracking, cycle.lastPeriodDate, cycle.cycleDays]);

  // Regenerate suggestions on mount and whenever inputs change.
  // Titles already accepted/dismissed today are excluded so they don't
  // reappear when adding an activity changes todayEvents.
  useEffect(() => {
    const fresh = buildSuggestions({ events: todayEvents, goal: profile.goal ?? undefined, cyclePhase });
    const blocked = consumedDate === todayStr ? new Set(consumedTitles) : new Set<string>();
    setSuggestions(fresh.filter((sg) => !blocked.has(sg.title)));
  }, [todayEvents, profile.goal, cyclePhase, setSuggestions, consumedTitles, consumedDate, todayStr]);

  const visibleSuggestions = suggestions.filter((sg) => !sg.accepted && !sg.dismissed);

  const panelsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // Always start in day view (guard against stale persisted state)
  useEffect(() => { setViewMode('day'); }, []);

  // Reset slideX when entering day view from week/month (stop any in-flight animation)
  useEffect(() => {
    if (viewMode === 'day') {
      cancelAnimation(slideX);
      slideX.value = -width;
    }
  }, [viewMode]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={{ flex: 1 }} {...(viewMode === 'day' ? swipe.panHandlers : {})}>
      <View style={s.header}>
        <View>
          <View style={s.dateLabelRow}>
            <Text style={s.dateLabel} accessibilityLabel="Date du jour">
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={s.titleRow}>
            {viewMode === 'day' && (
              <TouchableOpacity
                onPress={() => slideDay('prev')}
                style={s.navArrow}
                accessibilityLabel="Jour précédent"
                accessibilityRole="button"
              >
                <Icon name="back" size={16} stroke={C.primary} />
              </TouchableOpacity>
            )}
            <Text style={s.title}>{getDayTitle(dayOffset)}</Text>
            {viewMode === 'day' && (
              <TouchableOpacity
                onPress={() => slideDay('next')}
                style={s.navArrow}
                accessibilityLabel="Jour suivant"
                accessibilityRole="button"
              >
                <Icon name="arrow" size={16} stroke={C.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={s.headerRight}>
          <View style={s.badge}>
            <Icon name="clock" size={14} stroke={C.ink2} />
            <Text style={s.badgeText}>
              {Math.round(scheduledHours(todayEvents))}h planifiées
            </Text>
          </View>
          <TouchableOpacity
            style={s.chatBtn}
            onPress={() => router.push('/chat' as any)}
            accessibilityLabel="Ouvrir le chat Dona"
            accessibilityRole="button"
          >
            <Icon name="spark" size={20} stroke={C.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Segmented view switcher — Jour / Semaine / Mois */}
      <View style={s.segmentRow}>
        {VIEW_MODE_ORDER.map((m) => {
          const on = viewMode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[s.segment, on && s.segmentOn]}
              onPress={() => setViewMode(m)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Vue ${VIEW_MODE_LABELS[m]}`}
            >
              <Text style={[s.segmentText, on && s.segmentTextOn]}>{VIEW_MODE_LABELS[m]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cycle phase mini-badge */}
      {cyclePhase && (
        <View style={[s.phaseBadge, { borderColor: PHASE_COLOR[cyclePhase] }]}>
          <View style={[s.phaseDot, { backgroundColor: PHASE_COLOR[cyclePhase] }]} />
          <Text style={[s.phaseText, { color: PHASE_COLOR[cyclePhase] }]}>
            {PHASE_LABEL[cyclePhase]}
          </Text>
        </View>
      )}

      {viewMode === 'week'  && <WeekView />}
      {viewMode === 'month' && <MonthView />}
      {viewMode === 'day' && (
        <View style={s.dayClipper}>
          <Animated.View
            style={[s.dayPanels, { width: width * 3 }, panelsStyle]}
          >
            {[dayOffset - 1, dayOffset, dayOffset + 1].map((off) => (
              <DayPanel
                key={off}
                absOffset={off}
                sleep={sleep}
                meals={meals}
                activities={activities}
                overrides={overrides}
                onActivityPress={handleActivityPress}
                onActivityLongPress={handleActivityLongPress}
                visibleSuggestions={visibleSuggestions}
                onAccept={openSuggestionAccept}
                onDismiss={dismissSuggestion}
                nowHour={nowHour}
                panelWidth={width}
              />
            ))}
          </Animated.View>
        </View>
      )}
      </View>

      {/* ── Completion sheet: marquer fait / sauté ───────────────────────────── */}
      <Sheet
        open={!!completionTarget}
        onClose={() => setCompletionTarget(null)}
        title={completionActivity?.title ?? 'Activité'}
      >
        <TouchableOpacity style={sh.option} onPress={() => markCompletion(true)} accessibilityRole="button">
          <View style={[sh.optionIcon, { backgroundColor: '#C8F0D4' }]}>
            <Icon name="check" size={20} stroke={C.mealInk} sw={2.2} />
          </View>
          <View style={sh.optionText}>
            <Text style={sh.optionLabel}>Activité réalisée</Text>
            <Text style={sh.optionSub}>Marquer comme complétée aujourd'hui</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={sh.option} onPress={() => markCompletion(false)} accessibilityRole="button">
          <View style={[sh.optionIcon, { backgroundColor: C.surfaceSunk }]}>
            <Icon name="x" size={20} stroke={C.ink2} sw={2.2} />
          </View>
          <View style={sh.optionText}>
            <Text style={sh.optionLabel}>Activité sautée</Text>
            <Text style={sh.optionSub}>Indiquer que tu n'as pas pu la faire</Text>
          </View>
        </TouchableOpacity>
        {existingCompletion && (
          <TouchableOpacity style={sh.option} onPress={resetCompletion} accessibilityRole="button">
            <View style={[sh.optionIcon, { backgroundColor: C.primaryTint }]}>
              <Ionicons name="refresh-outline" size={20} color={C.primary} />
            </View>
            <View style={sh.optionText}>
              <Text style={sh.optionLabel}>Remettre à zéro</Text>
              <Text style={sh.optionSub}>Annuler le statut et repasser en neutre</Text>
            </View>
          </TouchableOpacity>
        )}
      </Sheet>

      {/* ── Choice sheet: modifier ce jour vs. toujours ─────────────────────── */}
      <Sheet
        open={!!choiceTarget}
        onClose={() => setChoiceTarget(null)}
        title={choiceActivity?.title ?? ''}
      >
        <TouchableOpacity style={sh.option} onPress={openSingleEdit} accessibilityRole="button">
          <View style={[sh.optionIcon, { backgroundColor: C.primaryTint }]}>
            <Ionicons name="calendar-outline" size={20} color={C.primary} />
          </View>
          <View style={sh.optionText}>
            <Text style={sh.optionLabel}>Modifier ce jour uniquement</Text>
            <Text style={sh.optionSub}>Changer l'horaire ou le titre pour cette occurrence</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={sh.option}
          onPress={() => {
            if (choiceTarget) {
              router.navigate({ pathname: '/(tabs)/activities', params: { editId: choiceTarget.activityId } } as any);
              setChoiceTarget(null);
            }
          }}
          accessibilityRole="button"
        >
          <View style={[sh.optionIcon, { backgroundColor: C.surfaceSunk }]}>
            <Ionicons name="repeat-outline" size={20} color={C.ink2} />
          </View>
          <View style={sh.optionText}>
            <Text style={sh.optionLabel}>Modifier tous les jours</Text>
            <Text style={sh.optionSub}>Changer la récurrence ou les jours</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={sh.option} onPress={cancelOccurrence} accessibilityRole="button">
          <View style={[sh.optionIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </View>
          <View style={sh.optionText}>
            <Text style={[sh.optionLabel, { color: '#DC2626' }]}>Supprimer ce jour</Text>
            <Text style={sh.optionSub}>Masquer l'activité uniquement pour cette date</Text>
          </View>
        </TouchableOpacity>

        {overrides.some(
          (o) => o.activityId === choiceTarget?.activityId && o.date === choiceTarget?.date,
        ) && (
          <TouchableOpacity
            style={sh.option}
            onPress={() => {
              if (choiceTarget) {
                removeOverride(choiceTarget.activityId, choiceTarget.date);
                if (userId) deleteOverrideRemote(userId, choiceTarget.activityId, choiceTarget.date);
                setChoiceTarget(null);
              }
            }}
            accessibilityRole="button"
          >
            <View style={[sh.optionIcon, { backgroundColor: C.primaryTint }]}>
              <Ionicons name="refresh-outline" size={20} color={C.primary} />
            </View>
            <View style={sh.optionText}>
              <Text style={sh.optionLabel}>Réinitialiser ce jour</Text>
              <Text style={sh.optionSub}>Revenir à l'activité d'origine</Text>
            </View>
          </TouchableOpacity>
        )}
      </Sheet>

      {/* ── Single-occurrence edit sheet ──────────────────────────────────────── */}
      <Sheet
        open={!!singleEdit}
        onClose={() => setSingleEdit(null)}
        title="Modifier ce jour"
      >
        {singleEdit && (
          <>
            <View style={sh.field}>
              <Text style={sh.fieldLabel}>Titre</Text>
              <TextInput
                style={sh.input}
                value={singleEdit.title}
                onChangeText={(v) => setSingleEdit((st) => st ? { ...st, title: v } : st)}
                placeholderTextColor={C.ink3}
                returnKeyType="done"
                accessibilityLabel="Titre de l'activité"
              />
            </View>

            <View style={sh.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Début</Text>
                <View style={sh.timeCard}>
                  <TimeField
                    value={singleEdit.startTime}
                    onChange={(v) => setSingleEdit((st) => st ? { ...st, startTime: v } : st)}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Fin</Text>
                <View style={sh.timeCard}>
                  <TimeField
                    value={singleEdit.endTime}
                    onChange={(v) => setSingleEdit((st) => st ? { ...st, endTime: v } : st)}
                  />
                </View>
              </View>
            </View>

            <View style={sh.field}>
              <Text style={sh.fieldLabel}>Couleur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sh.colorRow}>
                <TouchableOpacity
                  style={[sh.swatch, !singleEdit.color && sh.swatchSelected,
                    { backgroundColor: C.surfaceSunk }]}
                  onPress={() => setSingleEdit((st) => st ? { ...st, color: undefined } : st)}
                  accessibilityLabel="Couleur par défaut"
                />
                {COLOR_PALETTE.map((p) => {
                  const on = singleEdit.color?.bg === p.bg;
                  return (
                    <TouchableOpacity
                      key={p.bg}
                      style={[sh.swatch, { backgroundColor: p.bg }, on && sh.swatchSelected]}
                      onPress={() => setSingleEdit((st) => st ? { ...st, color: { bg: p.bg, ink: p.ink } } : st)}
                      accessibilityLabel={p.label}
                    />
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity style={sh.saveBtn} onPress={saveSingleEdit} accessibilityRole="button">
              <Text style={sh.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </>
        )}
      </Sheet>

      {/* ── Suggestion accept sheet: adjust the proposed slot ─────────────────── */}
      <Sheet
        open={!!suggestEdit}
        onClose={() => setSuggestEdit(null)}
        title={suggestEdit?.suggestion.title ?? 'Suggestion'}
      >
        {suggestEdit && (
          <>
            <Text style={sh.suggestHint}>
              Ajuste le créneau si besoin, puis ajoute l'activité à ton planning du jour.
            </Text>

            <View style={sh.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Début</Text>
                <View style={sh.timeCard}>
                  <TimeField
                    value={suggestEdit.startTime}
                    onChange={(v) => setSuggestEdit((st) => st ? { ...st, startTime: v } : st)}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sh.fieldLabel}>Fin</Text>
                <View style={sh.timeCard}>
                  <TimeField
                    value={suggestEdit.endTime}
                    onChange={(v) => setSuggestEdit((st) => st ? { ...st, endTime: v } : st)}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity style={sh.saveBtn} onPress={confirmSuggestion} accessibilityRole="button" accessibilityLabel="Ajouter au planning">
              <Text style={sh.saveBtnText}>Ajouter au planning</Text>
            </TouchableOpacity>
          </>
        )}
      </Sheet>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: C.background },
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
      color: C.primaryStrong,
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
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 26,
      fontWeight: '800',
      color: C.ink,
      letterSpacing: -0.5,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    chatBtn: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: C.surface,
      borderRadius: Radius.pill,
      paddingHorizontal: 13,
      paddingVertical: 8,
      ...Shadow.sm,
    },
    badgeText: { fontSize: 13.5, fontWeight: '600', color: C.ink2 },

    dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },

    // Segmented view switcher
    segmentRow: {
      flexDirection: 'row',
      marginHorizontal: 22,
      marginBottom: Spacing.sm,
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.pill,
      padding: 3,
      gap: 3,
    },
    segment: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: Radius.pill,
      alignItems: 'center',
    },
    segmentOn: {
      backgroundColor: C.surface,
      ...Shadow.sm,
    },
    segmentText:   { fontSize: FontSize.sm, fontWeight: '600', color: C.ink3 },
    segmentTextOn: { color: C.primaryStrong, fontWeight: '700' },

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
      backgroundColor: C.surface,
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
      color: C.ink3,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.xs,
    },

    grid: { position: 'relative', paddingLeft: 50 },
  });
}

function makeSheetStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: C.hairline,
    },
    optionIcon: {
      width: 40, height: 40, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
    },
    optionText:  { flex: 1 },
    optionLabel: { fontSize: FontSize.base, fontWeight: '700', color: C.ink },
    suggestHint: { fontSize: FontSize.sm, color: C.ink2, lineHeight: 20, marginTop: Spacing.xs },
    optionSub:   { fontSize: FontSize.sm, fontWeight: '500', color: C.ink3, marginTop: 2 },

    field:      { gap: Spacing.xs, marginTop: Spacing.md },
    fieldLabel: {
      fontSize: 11, fontWeight: '700', color: C.ink3,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.base,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
    },
    timeRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
    timeCard: {
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.sm,
      marginTop: Spacing.xs,
    },
    colorRow:      { marginTop: Spacing.xs },
    swatch: {
      width: 32, height: 32, borderRadius: 16,
      marginRight: Spacing.sm,
      borderWidth: 2, borderColor: 'transparent',
    },
    swatchSelected: { borderColor: C.primary },

    saveBtn: {
      marginTop: Spacing.lg,
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.base,
      alignItems: 'center',
    },
    saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: C.onPrimary },
  });
}
