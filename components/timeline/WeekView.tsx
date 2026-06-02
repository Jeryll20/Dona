import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay } from '@/lib/optimizer';
import type { TimelineEvent, WeekDay } from '@/types';

const WEEK_ORDER: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const VIEW_START = 6;
const VIEW_END   = 23;
const VIEW_RANGE = VIEW_END - VIEW_START;
const COL_H      = 240;

const CAT_LEGEND: { key: 'sommeil' | 'travail' | 'activite' | 'repas'; label: string }[] = [
  { key: 'sommeil',  label: 'Sommeil'  },
  { key: 'travail',  label: 'Travail'  },
  { key: 'activite', label: 'Activité' },
  { key: 'repas',    label: 'Repas'    },
];

function getMonday(): Date {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return d;
}

function getTodayKey(): WeekDay {
  return WEEK_ORDER[(new Date().getDay() + 6) % 7];
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

export function WeekView() {
  const { sleep, meals } = useUserStore();
  const activities = useScheduleStore((s) => s.activities);

  const monday   = useMemo(getMonday, []);
  const todayKey = getTodayKey();

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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.row}>
        {WEEK_ORDER.map((day, idx) => {
          const date     = weekDates[idx];
          const isToday  = day === todayKey;

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

              <View style={styles.timeline}>
                {dayEvents
                  .filter((ev) => !ev.thin)
                  .map((ev, i) => {
                    const cs = Math.max(ev.start, VIEW_START);
                    const ce = Math.min(ev.end, VIEW_END);
                    if (ce <= cs) return null;
                    const top    = ((cs - VIEW_START) / VIEW_RANGE) * COL_H;
                    const height = Math.max(((ce - cs) / VIEW_RANGE) * COL_H, 3);
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

      <View style={styles.legend}>
        {CAT_LEGEND.map(({ key, label }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CAT[key].bg, borderColor: CAT[key].ink }]} />
            <Text style={styles.legendLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:    { flex: 1 },
  container: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 120 },

  row: {
    flexDirection: 'row',
    gap: 4,
  },

  column: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Radius.input,
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  columnToday: {
    backgroundColor: Colors.light.primaryTint,
  },

  dayLetter: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.light.ink3,
    letterSpacing: 0.3,
  },
  dayLetterToday: {
    color: Colors.light.primaryStrong,
  },

  dateBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  dateBubbleToday: {
    backgroundColor: Colors.light.primary,
  },
  dateNum: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.light.ink3,
  },
  dateNumToday: {
    color: Colors.light.onPrimary,
  },

  timeline: {
    width: '100%',
    height: COL_H,
    position: 'relative',
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
    marginTop: Spacing.lg,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.light.ink3,
  },
});
