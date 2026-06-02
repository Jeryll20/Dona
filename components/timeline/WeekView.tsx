import {
  View, Text, TouchableOpacity, PanResponder,
  Animated, useWindowDimensions, StyleSheet,
} from 'react-native';
import { useState, useMemo, useRef } from 'react';
import { Colors } from '@/constants/Colors';
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
}

function WeekPanel({
  weekOffset, baseEvents, activities, panelWidth,
  timelineH, onTimelineLayout, todayStr,
}: WeekPanelProps) {
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
          <View key={day} style={[styles.column, isToday && styles.columnToday]}>
            <Text style={[styles.dayLetter, isToday && styles.dayLetterToday]}>
              {WEEK_LABELS[idx]}
            </Text>
            <View style={[styles.dateBubble, isToday && styles.dateBubbleToday]}>
              <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>
                {date.getDate()}
              </Text>
            </View>
            <View
              style={styles.timeline}
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
                          styles.block,
                          { top, height, backgroundColor: CAT[ev.cat]?.bg ?? Colors.light.hairline },
                        ]}
                      />
                    );
                  })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [timelineH, setTimelineH]   = useState<number | undefined>(undefined);

  const { sleep, meals } = useUserStore();
  const activities = useScheduleStore((s) => s.activities);

  const { width } = useWindowDimensions();
  const widthRef  = useRef(width);
  widthRef.current = width;

  // slideX = -width means center panel is visible
  const slideX = useRef(new Animated.Value(-width)).current;

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

  const goPrev = () => {
    const w = widthRef.current;
    Animated.timing(slideX, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
      setWeekOffset((o) => o - 1);
      slideX.setValue(-w);
    });
  };
  const goNext = () => {
    const w = widthRef.current;
    Animated.timing(slideX, { toValue: -2 * w, duration: 280, useNativeDriver: true }).start(() => {
      setWeekOffset((o) => o + 1);
      slideX.setValue(-w);
    });
  };

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 15,
      onPanResponderGrant: () => {
        slideX.stopAnimation((val) => {
          slideX.setOffset(val);
          slideX.setValue(0);
        });
      },
      onPanResponderMove: (_, { dx }) => slideX.setValue(dx),
      onPanResponderRelease: (_, { dx, vx }) => {
        slideX.flattenOffset();
        const w = widthRef.current;
        if (dx > 70 || vx > 0.5) {
          Animated.timing(slideX, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
            setWeekOffset((o) => o - 1);
            slideX.setValue(-w);
          });
        } else if (dx < -70 || vx < -0.5) {
          Animated.timing(slideX, { toValue: -2 * w, duration: 280, useNativeDriver: true }).start(() => {
            setWeekOffset((o) => o + 1);
            slideX.setValue(-w);
          });
        } else {
          Animated.spring(slideX, { toValue: -w, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        slideX.flattenOffset();
        Animated.spring(slideX, { toValue: -widthRef.current, useNativeDriver: true }).start();
      },
    })
  ).current;

  const currentMonday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);

  return (
    <View style={styles.container} {...swipe.panHandlers}>
      {/* Fixed nav header */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={goPrev} style={styles.navBtn} accessibilityLabel="Semaine précédente" accessibilityRole="button">
          <Icon name="back" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{formatWeekRange(currentMonday)}</Text>
        <TouchableOpacity onPress={goNext} style={styles.navBtn} accessibilityLabel="Semaine suivante" accessibilityRole="button">
          <Icon name="arrow" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* 3-panel sliding area */}
      <View style={styles.clipper}>
        <Animated.View
          style={[styles.threePanels, { width: width * 3, transform: [{ translateX: slideX }] }]}
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
            />
          ))}
        </Animated.View>
      </View>

      {/* Fixed legend */}
      <View style={styles.legend}>
        {CAT_LEGEND.map(({ key, label }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CAT[key].bg, borderColor: CAT[key].ink }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.light.ink,
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
    backgroundColor: Colors.light.primaryTint,
  },

  dayLetter: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink3,
    letterSpacing: 0.3,
  },
  dayLetterToday: {
    color: Colors.light.primaryStrong,
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
    backgroundColor: Colors.light.primary,
  },
  dateNum: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.ink3,
  },
  dateNumToday: {
    color: Colors.light.onPrimary,
  },

  timeline: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.light.surfaceSunk,
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
    color: Colors.light.ink3,
  },
});
