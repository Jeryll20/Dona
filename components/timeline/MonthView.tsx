import {
  View, Text, TouchableOpacity, Pressable, PanResponder,
  Animated, useWindowDimensions, StyleSheet,
} from 'react-native';
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

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m < 0)  { m += 12; y--; }
  while (m > 11) { m -= 12; y++; }
  return { year: y, month: m };
}

// ─── Single month panel ───────────────────────────────────────────────────────

interface MonthPanelProps {
  year: number;
  month: number;
  activities: ReturnType<typeof useScheduleStore.getState>['activities'];
  todayStr: string;
  panelWidth: number;
  onDayPress: (date: Date) => void;
}

function MonthPanel({ year, month, activities, todayStr, panelWidth, onDayPress }: MonthPanelProps) {
  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const catsForDate = (date: Date): CatKey[] => {
    const wday = weekKey(date);
    const seen = new Set<CatKey>();
    for (const a of activities) {
      if (a.days.includes(wday)) seen.add(a.cat);
    }
    return [...seen];
  };

  return (
    <View style={{ width: panelWidth, paddingHorizontal: Spacing.base }}>
      <View style={styles.colRow}>
        {COL_LABELS.map((l, i) => (
          <Text key={i} style={styles.colLabel}>{l}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.map((date, i) => {
          if (!date) return <View key={i} style={styles.cell} />;
          const isToday = date.toDateString() === todayStr;
          const cats    = catsForDate(date).slice(0, 3);
          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => onDayPress(date)}
              accessibilityRole="button"
              accessibilityLabel={date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            >
              <View style={[styles.numWrap, isToday && styles.numWrapToday]}>
                <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                  {date.getDate()}
                </Text>
              </View>
              {cats.length > 0 && (
                <View style={styles.dotRow}>
                  {cats.map((cat) => (
                    <View key={cat} style={[styles.dot, { backgroundColor: CAT[cat].ink }]} />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MonthView() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const activities   = useScheduleStore((s) => s.activities);
  const setViewMode  = useScheduleStore((s) => s.setViewMode);
  const setDayOffset = useScheduleStore((s) => s.setDayOffset);
  const todayStr     = now.toDateString();

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
  const slideX = useRef(new Animated.Value(-width)).current;

  const goPrev = () => {
    const w = widthRef.current;
    Animated.timing(slideX, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
      setMonth((m) => { if (m === 0) { setYear((y) => y - 1); return 11; } return m - 1; });
      slideX.setValue(-w);
    });
  };

  const goNext = () => {
    const w = widthRef.current;
    Animated.timing(slideX, { toValue: -2 * w, duration: 280, useNativeDriver: true }).start(() => {
      setMonth((m) => { if (m === 11) { setYear((y) => y + 1); return 0; } return m + 1; });
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
            setMonth((m) => { if (m === 0) { setYear((y) => y - 1); return 11; } return m - 1; });
            slideX.setValue(-w);
          });
        } else if (dx < -70 || vx < -0.5) {
          Animated.timing(slideX, { toValue: -2 * w, duration: 280, useNativeDriver: true }).start(() => {
            setMonth((m) => { if (m === 11) { setYear((y) => y + 1); return 0; } return m + 1; });
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

  const prevData = useMemo(() => shiftMonth(year, month, -1), [year, month]);
  const nextData = useMemo(() => shiftMonth(year, month,  1), [year, month]);

  return (
    <View style={styles.container} {...swipe.panHandlers}>
      {/* Navigation header — stays fixed */}
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={goPrev}
          style={styles.navBtn}
          accessibilityLabel="Mois précédent"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={styles.navBtn}
          accessibilityLabel="Mois suivant"
          accessibilityRole="button"
        >
          <Icon name="arrow" size={18} stroke={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* 3-panel sliding area */}
      <View style={styles.clipper}>
        <Animated.View
          style={[styles.threePanels, { width: width * 3, transform: [{ translateX: slideX }] }]}
        >
          {[prevData, { year, month }, nextData].map((m) => (
            <MonthPanel
              key={`${m.year}-${m.month}`}
              year={m.year}
              month={m.month}
              activities={activities}
              todayStr={todayStr}
              panelWidth={width}
              onDayPress={handleDayPress}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xs,
  },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
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
  monthTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.3,
  },

  clipper: {
    overflow: 'hidden',
  },

  threePanels: {
    flexDirection: 'row',
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
