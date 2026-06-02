import { View, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';
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
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
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

export function WeekView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [timelineH, setTimelineH]   = useState<number | undefined>(undefined);

  const { sleep, meals } = useUserStore();
  const activities = useScheduleStore((s) => s.activities);

  const monday   = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);
  const todayStr = new Date().toDateString();

  const baseEvents = useMemo<TimelineEvent[]>(() => {
    if (!sleep.waketime || !sleep.bedtime || sleep.prepMinutes == null) return [];
    return buildDefaultDay(
      { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
      meals,
    );
  }, [sleep.waketime, sleep.bedtime, sleep.prepMinutes, meals]);

  const weekDates = useMemo(
    () => WEEK_ORDER.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    }),
    [monday],
  );

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 15,
      onPanResponderRelease: (_, { dx }) => {
        if (dx > 50) setWeekOffset((o) => o - 1);
        else if (dx < -50) setWeekOffset((o) => o + 1);
      },
    })
  ).current;

  const goPrev = () => setWeekOffset((o) => o - 1);
  const goNext = () => setWeekOffset((o) => o + 1);

  return (
    <View style={styles.container} {...swipe.panHandlers}>
      {/* Week navigation header */}
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={goPrev}
          style={styles.navBtn}
          accessibilityLabel="Semaine précédente"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{formatWeekRange(monday)}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={styles.navBtn}
          accessibilityLabel="Semaine suivante"
          accessibilityRole="button"
        >
          <Icon name="arrow" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* 7-column mini-timeline grid */}
      <View style={styles.row}>
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
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (h > 0 && h !== timelineH) setTimelineH(h);
                }}
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

      {/* Legend */}
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
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.base,
  },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
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

  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
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
