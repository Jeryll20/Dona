import { useRef, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Animated,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/spacing';

const ITEM_H  = 52;
const VISIBLE = 5;
const PAD     = ((VISIBLE - 1) / 2) * ITEM_H; // 104 — centres first/last items

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface TimeFieldProps {
  value: string;    // "HH:MM"
  onChange: (v: string) => void;
}

interface WheelProps {
  items:    string[];
  initial:  number;
  onChange: (index: number) => void;
}

function Wheel({ items, initial, onChange }: WheelProps) {
  const ref            = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(initial);
  const scrollY        = useRef(new Animated.Value(initial * ITEM_H)).current;
  const committedRef   = useRef(initial);
  const isProgrammatic = useRef(false);
  const dragTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Opacity for each item derived continuously from raw scroll position —
  // symmetric interpolation gives a smooth fade without rounding artifacts
  const opacities = useMemo(
    () =>
      items.map((_, i) =>
        Animated.divide(
          Animated.subtract(scrollY, i * ITEM_H),
          ITEM_H,
        ).interpolate({
          inputRange:  [-2, -1, 0, 1, 2],
          outputRange: [0.15, 0.35, 1, 0.35, 0.15],
          extrapolate: 'clamp',
        }),
      ),
    // scrollY is a stable ref — deps intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const snapTo = useCallback(
    (offsetY: number) => {
      const i       = Math.round(offsetY / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, i));

      setSelected(clamped);

      if (clamped !== committedRef.current) {
        committedRef.current = clamped;
        onChange(clamped);
      }

      isProgrammatic.current = true;
      ref.current?.scrollTo({ y: clamped * ITEM_H, animated: false });
      isProgrammatic.current = false;
    },
    [items.length, onChange],
  );

  const onMomentumScrollBegin = useCallback(() => {
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammatic.current) return;
      snapTo(e.nativeEvent.contentOffset.y);
    },
    [snapTo],
  );

  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammatic.current) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      if (dragTimer.current) clearTimeout(dragTimer.current);
      dragTimer.current = setTimeout(() => {
        dragTimer.current = null;
        snapTo(offsetY);
      }, 60);
    },
    [snapTo],
  );

  // JS-thread listener: update selected state for font size / color
  const onScrollJS = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammatic.current) return;
      const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      setSelected(Math.max(0, Math.min(items.length - 1, i)));
    },
    [items.length],
  );

  const scrollHandler = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true, listener: onScrollJS },
      ),
    [scrollY, onScrollJS],
  );

  return (
    <Animated.ScrollView
      ref={ref as React.RefObject<ScrollView>}
      style={styles.wheel}
      contentContainerStyle={{ paddingVertical: PAD }}
      contentOffset={{ x: 0, y: initial * ITEM_H }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate={0.85}
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScrollEndDrag={onScrollEndDrag}
    >
      {items.map((item, i) => (
        <Animated.View key={item} style={[styles.item, { opacity: opacities[i] }]}>
          <Text style={[styles.itemText, i === selected && styles.itemSelected]}>
            {item}
          </Text>
        </Animated.View>
      ))}
    </Animated.ScrollView>
  );
}

export function TimeField({ value, onChange }: TimeFieldProps) {
  const [hStr, mStr] = value.split(':');
  const hourInitial = Math.max(0, Math.min(23, parseInt(hStr, 10) || 0));
  const minInitial  = Math.max(0, Math.min(59, parseInt(mStr, 10) || 0));

  const hourRef = useRef(hourInitial);
  const minRef  = useRef(minInitial);

  const onHour = useCallback((i: number) => {
    hourRef.current = i;
    onChange(`${String(i).padStart(2, '0')}:${String(minRef.current).padStart(2, '0')}`);
  }, [onChange]);

  const onMin = useCallback((i: number) => {
    minRef.current = i;
    onChange(`${String(hourRef.current).padStart(2, '0')}:${String(i).padStart(2, '0')}`);
  }, [onChange]);

  return (
    <View style={styles.wrap}>
      <View style={styles.band} pointerEvents="none" />
      <Wheel items={HOURS}   initial={hourInitial} onChange={onHour} />
      <Text style={styles.colon}>:</Text>
      <Wheel items={MINUTES} initial={minInitial}  onChange={onMin} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: VISIBLE * ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.input,
  },
  wheel: { flex: 1 },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 28,
    fontWeight: '400',
    color: Colors.light.ink3,
    textAlign: 'center',
  },
  itemSelected: {
    fontSize: 38,
    fontWeight: '700',
    color: Colors.light.ink,
  },
  colon: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.light.ink,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
});
