import {
  View, Text, TouchableOpacity, Pressable, PanResponder,
  useWindowDimensions, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS, cancelAnimation,
} from 'react-native-reanimated';
import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { CAT } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';
import { useScheduleStore } from '@/store/useScheduleStore';
import { isActivityVisibleOn, toLocalISODate } from '@/lib/recurrence';
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
  const C = useColors();
  const s = makeStyles(C);
  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const catsForDate = (date: Date): CatKey[] => {
    const dateStr = toLocalISODate(date);
    const seen = new Set<CatKey>();
    for (const a of activities) {
      if (isActivityVisibleOn(a, dateStr)) seen.add(a.cat);
    }
    return [...seen];
  };

  return (
    <View style={{ width: panelWidth, paddingHorizontal: Spacing.base }}>
      <View style={s.colRow}>
        {COL_LABELS.map((l, i) => (
          <Text key={i} style={s.colLabel}>{l}</Text>
        ))}
      </View>
      <View style={s.grid}>
        {grid.map((date, i) => {
          if (!date) return <View key={i} style={s.cell} />;
          const isToday = date.toDateString() === todayStr;
          const cats    = catsForDate(date).slice(0, 3);
          return (
            <Pressable
              key={i}
              style={s.cell}
              onPress={() => onDayPress(date)}
              accessibilityRole="button"
              accessibilityLabel={date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            >
              <View style={[s.numWrap, isToday && s.numWrapToday]}>
                <Text style={[s.dayNum, isToday && s.dayNumToday]}>
                  {date.getDate()}
                </Text>
              </View>
              {cats.length > 0 && (
                <View style={s.dotRow}>
                  {cats.map((cat) => (
                    <View key={cat} style={[s.dot, { backgroundColor: CAT[cat].ink }]} />
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
  const C = useColors();
  const s = makeStyles(C);
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const activities   = useScheduleStore((st) => st.activities);
  const setViewMode  = useScheduleStore((st) => st.setViewMode);
  const setDayOffset = useScheduleStore((st) => st.setDayOffset);
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
  const slideX      = useSharedValue(-width);
  const slideStartX = useRef(-width);

  function goPrevMonth() {
    setMonth((m) => { if (m === 0) { setYear((y) => y - 1); return 11; } return m - 1; });
  }
  function goNextMonth() {
    setMonth((m) => { if (m === 11) { setYear((y) => y + 1); return 0; } return m + 1; });
  }

  // Recenter in the same frame as the re-rendered panels (see index.tsx —
  // resetting slideX before the React commit flashes the old month)
  useLayoutEffect(() => {
    cancelAnimation(slideX);
    slideX.value = -widthRef.current;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const goPrev = () => {
    slideX.value = withTiming(0, { duration: 280 }, () => {
      runOnJS(goPrevMonth)();
    });
  };
  const goNext = () => {
    const w = widthRef.current;
    slideX.value = withTiming(-2 * w, { duration: 280 }, () => {
      runOnJS(goNextMonth)();
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
            runOnJS(goPrevMonth)();
          });
        } else if (dx < -70 || vx < -0.5) {
          slideX.value = withTiming(-2 * w, { duration: 280 }, () => {
            runOnJS(goNextMonth)();
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

  const prevData = useMemo(() => shiftMonth(year, month, -1), [year, month]);
  const nextData = useMemo(() => shiftMonth(year, month,  1), [year, month]);

  return (
    <View style={s.container} {...swipe.panHandlers}>
      {/* Navigation header — stays fixed */}
      <View style={s.nav}>
        <TouchableOpacity
          onPress={goPrev}
          style={s.navBtn}
          accessibilityLabel="Mois précédent"
          accessibilityRole="button"
        >
          <Icon name="back" size={18} stroke={C.primary} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={s.navBtn}
          accessibilityLabel="Mois suivant"
          accessibilityRole="button"
        >
          <Icon name="arrow" size={18} stroke={C.primary} />
        </TouchableOpacity>
      </View>

      {/* 3-panel sliding area */}
      <View style={s.clipper}>
        <Animated.View
          style={[s.threePanels, { width: width * 3 }, panelsStyle]}
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

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
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
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthTitle: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: C.ink,
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
      color: C.ink3,
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
      backgroundColor: C.primary,
    },
    dayNum: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: C.ink2,
    },
    dayNumToday: {
      color: C.onPrimary,
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
}
