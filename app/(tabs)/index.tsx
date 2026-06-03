import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  PanResponder, useWindowDimensions, TextInput,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, COLOR_PALETTE } from '@/constants/Colors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { TimeField } from '@/components/ui/TimeField';
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
  return d.toISOString().split('T')[0];
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
  overrides: ActivityOverride[];
  onActivityPress: (activityId: string, date: string, isRecurring: boolean) => void;
  visibleSuggestions: Suggestion[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  nowHour: number;
  panelWidth: number;
}

function DayPanel({
  absOffset, sleep, meals,
  activities, overrides, onActivityPress,
  visibleSuggestions, onAccept, onDismiss, nowHour, panelWidth,
}: DayPanelProps) {
  const d = new Date();
  d.setDate(d.getDate() + absOffset);
  const weekDay = DAY_MAP[d.getDay()];
  const dateStr = d.toISOString().split('T')[0];
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
      if (!a.days.includes(weekDay)) continue;
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
        color:      ov?.color ?? a.color,
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
            ? <ThinBlock     key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} onPress={getPressHandler(ev as any)} />
            : <TimelineBlock key={i} event={ev} hourHeight={HH} leftOffset={LEFT_OFFSET} onPress={getPressHandler(ev as any)} />
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
  const overrides    = useScheduleStore((s) => s.overrides);
  const setOverride  = useScheduleStore((s) => s.setOverride);
  const removeOverride = useScheduleStore((s) => s.removeOverride);
  const viewMode     = useScheduleStore((s) => s.viewMode);
  const setViewMode  = useScheduleStore((s) => s.setViewMode);
  const dayOffset    = useScheduleStore((s) => s.dayOffset);
  const setDayOffset = useScheduleStore((s) => s.setDayOffset);
  const { suggestions, setSuggestions, acceptSuggestion, dismissSuggestion } =
    useSuggestionsStore();

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
    setOverride({ activityId: choiceTarget.activityId, date: choiceTarget.date, cancelled: true });
    setChoiceTarget(null);
  }

  function saveSingleEdit() {
    if (!singleEdit) return;
    setOverride({
      activityId: singleEdit.activityId,
      date:       singleEdit.date,
      title:      singleEdit.title,
      startTime:  singleEdit.startTime,
      endTime:    singleEdit.endTime,
      color:      singleEdit.color,
    });
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

  // Regenerate suggestions on mount and whenever inputs change
  useEffect(() => {
    setSuggestions(buildSuggestions({ events: todayEvents, goal: profile.goal ?? undefined, cyclePhase }));
  }, [todayEvents, profile.goal, cyclePhase, setSuggestions]);

  const visibleSuggestions = suggestions.filter((s) => !s.accepted && !s.dismissed);

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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={{ flex: 1 }} {...(viewMode === 'day' ? swipe.panHandlers : {})}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setViewMode(VIEW_MODE_ORDER[(VIEW_MODE_ORDER.indexOf(viewMode) + 1) % 3])}
          accessibilityRole="button"
          accessibilityLabel="Changer la vue"
        >
          <View style={styles.dateLabelRow}>
            <Text style={styles.dateLabel} accessibilityLabel="Date du jour">
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <View style={styles.viewChip}>
              <Text style={styles.viewChipText}>{VIEW_MODE_LABELS[viewMode]}</Text>
            </View>
          </View>
          <View style={styles.titleRow}>
            {viewMode === 'day' && (
              <TouchableOpacity
                onPress={() => slideDay('prev')}
                style={styles.navArrow}
                accessibilityLabel="Jour précédent"
                accessibilityRole="button"
              >
                <Icon name="back" size={16} stroke={Colors.light.primary} />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{getDayTitle(dayOffset)}</Text>
            {viewMode === 'day' && (
              <TouchableOpacity
                onPress={() => slideDay('next')}
                style={styles.navArrow}
                accessibilityLabel="Jour suivant"
                accessibilityRole="button"
              >
                <Icon name="arrow" size={16} stroke={Colors.light.primary} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
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
                overrides={overrides}
                onActivityPress={handleActivityPress}
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

      {/* ── Choice sheet: modifier ce jour vs. toujours ─────────────────────── */}
      <Sheet
        open={!!choiceTarget}
        onClose={() => setChoiceTarget(null)}
        title={choiceActivity?.title ?? ''}
      >
        <TouchableOpacity style={sheet.option} onPress={openSingleEdit} accessibilityRole="button">
          <View style={[sheet.optionIcon, { backgroundColor: Colors.light.primaryTint }]}>
            <Ionicons name="calendar-outline" size={20} color={Colors.light.primary} />
          </View>
          <View style={sheet.optionText}>
            <Text style={sheet.optionLabel}>Modifier ce jour uniquement</Text>
            <Text style={sheet.optionSub}>Changer l'horaire ou le titre pour cette occurrence</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={sheet.option}
          onPress={() => {
            if (choiceTarget) {
              router.navigate({ pathname: '/(tabs)/activities', params: { editId: choiceTarget.activityId } } as any);
              setChoiceTarget(null);
            }
          }}
          accessibilityRole="button"
        >
          <View style={[sheet.optionIcon, { backgroundColor: Colors.light.surfaceSunk }]}>
            <Ionicons name="repeat-outline" size={20} color={Colors.light.ink2} />
          </View>
          <View style={sheet.optionText}>
            <Text style={sheet.optionLabel}>Modifier tous les jours</Text>
            <Text style={sheet.optionSub}>Changer la récurrence ou les jours</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={sheet.option} onPress={cancelOccurrence} accessibilityRole="button">
          <View style={[sheet.optionIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
          </View>
          <View style={sheet.optionText}>
            <Text style={[sheet.optionLabel, { color: '#DC2626' }]}>Supprimer ce jour</Text>
            <Text style={sheet.optionSub}>Masquer l'activité uniquement pour cette date</Text>
          </View>
        </TouchableOpacity>

        {overrides.some(
          (o) => o.activityId === choiceTarget?.activityId && o.date === choiceTarget?.date,
        ) && (
          <TouchableOpacity
            style={sheet.option}
            onPress={() => {
              if (choiceTarget) {
                removeOverride(choiceTarget.activityId, choiceTarget.date);
                setChoiceTarget(null);
              }
            }}
            accessibilityRole="button"
          >
            <View style={[sheet.optionIcon, { backgroundColor: Colors.light.primaryTint }]}>
              <Ionicons name="refresh-outline" size={20} color={Colors.light.primary} />
            </View>
            <View style={sheet.optionText}>
              <Text style={sheet.optionLabel}>Réinitialiser ce jour</Text>
              <Text style={sheet.optionSub}>Revenir à l'activité d'origine</Text>
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
            <View style={sheet.field}>
              <Text style={sheet.fieldLabel}>Titre</Text>
              <TextInput
                style={sheet.input}
                value={singleEdit.title}
                onChangeText={(v) => setSingleEdit((s) => s ? { ...s, title: v } : s)}
                placeholderTextColor={Colors.light.ink3}
                returnKeyType="done"
                accessibilityLabel="Titre de l'activité"
              />
            </View>

            <View style={sheet.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={sheet.fieldLabel}>Début</Text>
                <View style={sheet.timeCard}>
                  <TimeField
                    value={singleEdit.startTime}
                    onChange={(v) => setSingleEdit((s) => s ? { ...s, startTime: v } : s)}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheet.fieldLabel}>Fin</Text>
                <View style={sheet.timeCard}>
                  <TimeField
                    value={singleEdit.endTime}
                    onChange={(v) => setSingleEdit((s) => s ? { ...s, endTime: v } : s)}
                  />
                </View>
              </View>
            </View>

            <View style={sheet.field}>
              <Text style={sheet.fieldLabel}>Couleur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={sheet.colorRow}>
                <TouchableOpacity
                  style={[sheet.swatch, !singleEdit.color && sheet.swatchSelected,
                    { backgroundColor: Colors.light.surfaceSunk }]}
                  onPress={() => setSingleEdit((s) => s ? { ...s, color: undefined } : s)}
                  accessibilityLabel="Couleur par défaut"
                />
                {COLOR_PALETTE.map((p) => {
                  const on = singleEdit.color?.bg === p.bg;
                  return (
                    <TouchableOpacity
                      key={p.bg}
                      style={[sheet.swatch, { backgroundColor: p.bg }, on && sheet.swatchSelected]}
                      onPress={() => setSingleEdit((s) => s ? { ...s, color: { bg: p.bg, ink: p.ink } } : s)}
                      accessibilityLabel={p.label}
                    />
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity style={sheet.saveBtn} onPress={saveSingleEdit} accessibilityRole="button">
              <Text style={sheet.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
          </>
        )}
      </Sheet>
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

  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  viewChip: {
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  viewChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
    letterSpacing: 0.3,
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

const sheet = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.hairline,
  },
  optionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  optionText:  { flex: 1 },
  optionLabel: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink },
  optionSub:   { fontSize: FontSize.sm, fontWeight: '500', color: Colors.light.ink3, marginTop: 2 },

  field:      { gap: Spacing.xs, marginTop: Spacing.md },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
  },
  timeRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  timeCard: {
    backgroundColor: Colors.light.surfaceSunk,
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
  swatchSelected: { borderColor: Colors.light.primary },

  saveBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
