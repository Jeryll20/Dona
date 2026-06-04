import {
  View, Text, TouchableOpacity, PanResponder,
  useWindowDimensions, StyleSheet, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { useState, useMemo, useRef } from 'react';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay } from '@/lib/optimizer';
import type { TimelineEvent, WeekDay } from '@/types';

const WEEK_ORDER: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const VIEW_START = 6;
const VIEW_END   = 23;
const VIEW_RANGE = VIEW_END - VIEW_START;

const CAT_LEGEND: { key: 'sommeil' | 'travail' | 'activite' | 'repas'; label: string }[] = [
  { key: 'sommeil',  label: 'Sommeil'  },
  { key: 'travail',  label: 'Travail'  },
  { key: 'activite', label: 'Activité' },
  { key: 'repas',    label: 'Repas'    },
];

function getWeekMonday(offset: number): Date {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const d = new Date(today);
  d.setDate(today.getDate() - dow + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sd = monday.getDate();
  const ed = sunday.getDate();
  const sm = monday.toLocaleDateString('fr-FR', { month: 'short' });
  const em = sunday.toLocaleDateString('fr-FR', { month: 'short' });
  if (monday.getMonth() === sunday.getMonth()) return `${sd} – ${ed} ${sm}`;
  return `${sd} ${sm} – ${ed} ${em}`;
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

// ─── Single week panel ────────────────────────────────────────────────────────

interface WeekPanelProps {
  weekOffset: number;
  baseEvents: TimelineEvent[];
  activities: ReturnType<typeof useScheduleStore.getState>['activities'];
  panelWidth: number;
  timelineH: number | undefined;
  onTimelineLayout: (h: number) => void;
  todayStr: string;
  onDayPress: (date: Date) => void;
}

function WeekPanel({
  weekOffset, baseEvents, activities, panelWidth,
  timelineH, onTimelineLayout, todayStr, onDayPress,
}: WeekPanelProps) {
  const C = useColors();
  const s = makeStyles(C);
  const monday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);
  const weekDates = useMemo(
    () => WEEK_ORDER.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    }),
    [monday],
  );

  return (
    <View style={{ width: panelWidth, flex: 1, flexDirection: 'row', gap: 4 }}>
      {WEEK_ORDER.map((day, idx) => {
        const date    = weekDates[idx];
        const isToday = date.toDateString() === todayStr;

        const dayActivities: TimelineEvent[] = activities
          .filter((a) => a.days.includes(day))
          .map((a) => ({
            cat:   a.cat,
            title: a.title,
            start: parseTime(a.startTime),
            end:   parseTime(a.endTime),
          }));

        const dayEvents = [...baseEvents, ...dayActivities].sort((a, b) => a.start - b.start);

        return (
          <Pressable
            key={day}
            style={[s.column, isToday && s.columnToday]}
            onPress={() => onDayPress(date)}
            accessibilityRole="button"
            accessibilityLabel={`Voir le ${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
          >
            <Text style={[s.dayLetter, isToday && s.dayLetterToday]}>
              {WEEK_LABELS[idx]}
            </Text>
            <View style={[s.dateBubble, isToday && s.dateBubbleToday]}>
              <Text style={[s.dateNum, isToday && s.dateNumToday]}>
                {date.getDate()}
              </Text>
            </View>
            <View
              style={s.timeline}
              onLayout={(e) => onTimelineLayout(e.nativeEvent.layout.height)}
            >
              {timelineH != null &&
                dayEvents
                  .filter((ev) => !ev.thin)
                  .map((ev, i) => {
                    const cs = Math.max(ev.start, VIEW_START);
                    const ce = Math.min(ev.end, VIEW_END);
                    if (ce <= cs) return null;
                    const top    = ((cs - VIEW_START) / VIEW_RANGE) * timelineH;
                    const height = Math.max(((ce - cs) / VIEW_RANGE) * timelineH, 3);
                    return (
                      <View
                        key={i}
                        style={[
                          s.block,
                          { top, height, backgroundColor: CAT[ev.cat]?.bg ?? C.hairline },
                        ]}
                      />
                    );
                  })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeekView() {
  const C = useColors();
  const s = makeStyles(C);
  const [weekOffset, setWeekOffset] = useState(0);
  const [timelineH, setTimelineH]   = useState<number | undefined>(undefined);

  const { sleep, meals } = useUserStore();
  const activities   = useScheduleStore((st) => st.activities);
  const setViewMode  = useScheduleStore((st) => st.setViewMode);
  const setDayOffset = useScheduleStore((st) => st.setDayOffset);

  const handleDayPress = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const offset = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    setDayOffset(offset);
    setViewMode('day');
  };

  const { width } = useWindowDimensions();
  const widthRef  = useRef(width);
  widthRef.current = width;

  // slideX = -width means center panel is visible
  const slideX      = useSharedValue(-width);
  const slideStartX = useRef(-width);

  const todayStr = new Date().toDateString();

  const baseEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDefaultDay(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep.waketime, sleep.bedtime, sleep.prepMinutes, meals]);

  const handleTimelineLayout = (h: number) => {
    if (h > 0 && h !== timelineH) setTimelineH(h);
  };

  function goPrevWeek() {
    slideX.value = -widthRef.current;
    setWeekOffset((o: number) => o - 1);
  }
  function goNextWeek() {
    slideX.value = -widthRef.current;
    setWeekOffset((o: number) => o + 1);
  }

  const goPrev = () => {
    slideX.value = withTiming(0, { duration: 280 }, () => {
      runOnJS(goPrevWeek)();
    });
  };
  const goNext = () => {
    const w = widthRef.current;
    slideX.value = withTiming(-2 * w, { duration: 280 }, () => {
      runOnJS(goNextWeek)();
    });
  };

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 15,
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
            runOnJS(goPrevWeek)();
          });
        } else if (dx < -70 || vx < -0.5) {
          slideX.value = withTiming(-2 * w, { duration: 280 }, () => {
            runOnJS(goNextWeek)();
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

  const panelsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  const currentMonday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);

  return (
    <View style={s.container} {...swipe.panHandlers}>
      {/* Fixed nav header */}
      <View style={s.nav}>
        <TouchableOpacity onPress={goPrev} style={s.navBtn} accessibilityLabel="Semaine précédente" accessibilityRole="button">
          <Icon name="back" size={18} stroke={C.primary} />
        </TouchableOpacity>
        <Text style={s.weekLabel}>{formatWeekRange(currentMonday)}</Text>
        <TouchableOpacity onPress={goNext} style={s.navBtn} accessibilityLabel="Semaine suivante" accessibilityRole="button">
          <Icon name="arrow" size={18} stroke={C.primary} />
        </TouchableOpacity>
      </View>

      {/* 3-panel sliding area */}
      <View style={s.clipper}>
        <Animated.View
          style={[s.threePanels, { width: width * 3 }, panelsStyle]}
        >
          {[weekOffset - 1, weekOffset, weekOffset + 1].map((off) => (
            <WeekPanel
              key={off}
              weekOffset={off}
              baseEvents={baseEvents}
              activities={activities}
              panelWidth={width - Spacing.base * 2}
              timelineH={timelineH}
              onTimelineLayout={handleTimelineLayout}
              todayStr={todayStr}
              onDayPress={handleDayPress}
            />
          ))}
        </Animated.View>
      </View>

      {/* Fixed legend */}
      <View style={s.legend}>
        {CAT_LEGEND.map(({ key, label }) => (
          <View key={key} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: CAT[key].bg, borderColor: CAT[key].ink }]} />
            <Text style={s.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: Spacing.xs,
      paddingBottom: Spacing.base,
    },

    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.base,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: Radius.pill,
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekLabel: {
      fontSize: FontSize.md,
      fontWeight: '700',
      color: C.ink,
      letterSpacing: -0.2,
    },

    // Clips the 3x-wide animated strip to screen width
    clipper: {
      flex: 1,
      overflow: 'hidden',
    },

    // 3 panels side by side; height fills via alignSelf:'stretch' on children
    threePanels: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: Spacing.base,
      gap: 0,
    },

    column: {
      flex: 1,
      alignItems: 'center',
      borderRadius: Radius.input,
      paddingVertical: Spacing.xs,
      backgroundColor: 'transparent',
    },
    columnToday: {
      backgroundColor: C.primaryTint,
    },

    dayLetter: {
      fontSize: 10,
      fontWeight: '700',
      color: C.ink3,
      letterSpacing: 0.3,
    },
    dayLetterToday: {
      color: C.primaryStrong,
    },

    dateBubble: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      marginBottom: Spacing.xs,
    },
    dateBubbleToday: {
      backgroundColor: C.primary,
    },
    dateNum: {
      fontSize: 10,
      fontWeight: '700',
      color: C.ink3,
    },
    dateNumToday: {
      color: C.onPrimary,
    },

    timeline: {
      flex: 1,
      width: '100%',
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.sm,
      overflow: 'hidden',
    },

    block: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderRadius: 2,
    },

    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      justifyContent: 'center',
      paddingHorizontal: Spacing.base,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      borderWidth: 1.5,
    },
    legendLabel: {
      fontSize: FontSize.xs,
      fontWeight: '600',
      color: C.ink3,
    },
  });
}
