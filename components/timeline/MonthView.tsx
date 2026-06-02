import { View, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';
import { useState, useMemo, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';
import { useScheduleStore } from '@/store/useScheduleStore';
import type { WeekDay, CatKey } from '@/types';

const WEEK_KEYS: WeekDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COL_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function weekKey(date: Date): WeekDay {
  return WEEK_KEYS[(date.getDay() + 6) % 7];
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const first   = new Date(year, month, 1);
  const leading = (first.getDay() + 6) % 7;
  const grid: (Date | null)[] = Array(leading).fill(null);
  const d = new Date(first);
  while (d.getMonth() === month) {
    grid.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export function MonthView() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const activities = useScheduleStore((s) => s.activities);
  const grid       = useMemo(() => buildGrid(year, month), [year, month]);
  const todayStr   = now.toDateString();

  const catsForDate = (date: Date): CatKey[] => {
    const wday = weekKey(date);
    const seen = new Set<CatKey>();
    for (const a of activities) {
      if (a.days.includes(wday)) seen.add(a.cat);
    }
    return [...seen];
  };

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 15,
      onPanResponderRelease: (_, { dx }) => {
        if (dx > 50) prevMonth();
        else if (dx < -50) nextMonth();
      },
    })
  ).current;

  return (
    <View style={styles.container} {...swipe.panHandlers}>
      {/* Month navigation */}
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={prevMonth}
          style={styles.navBtn}
          accessibilityLabel="Mois précédent"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={styles.navBtn}
          accessibilityLabel="Mois suivant"
          accessibilityRole="button"
        >
          <Icon name="arrow" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekday column headers */}
      <View style={styles.colRow}>
        {COL_LABELS.map((l, i) => (
          <Text key={i} style={styles.colLabel}>{l}</Text>
        ))}
      </View>

      {/* Calendar cells */}
      <View style={styles.grid}>
        {grid.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const isToday = date.toDateString() === todayStr;
          const cats    = catsForDate(date).slice(0, 3);

          return (
            <View key={i} style={styles.cell}>
              <View style={[styles.numWrap, isToday && styles.numWrapToday]}>
                <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                  {date.getDate()}
                </Text>
              </View>
              {cats.length > 0 && (
                <View style={styles.dotRow}>
                  {cats.map((cat) => (
                    <View
                      key={cat}
                      style={[styles.dot, { backgroundColor: CAT[cat].ink }]}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
  },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.3,
  },

  colRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  colLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.light.ink3,
    letterSpacing: 0.3,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 5,
    minHeight: 52,
  },
  numWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numWrapToday: {
    backgroundColor: Colors.light.primary,
  },
  dayNum: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.ink2,
  },
  dayNumToday: {
    color: Colors.light.onPrimary,
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
