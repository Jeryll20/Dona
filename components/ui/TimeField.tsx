import { useRef, useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/spacing';

const ITEM_H  = 52;
const VISIBLE = 5;
const PAD     = ((VISIBLE - 1) / 2) * ITEM_H; // 104 — centers first/last items

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface TimeFieldProps {
  value: string;    // "HH:MM"
  onChange: (v: string) => void;
}

interface WheelProps {
  items:   string[];
  initial: number;
  onChange: (index: number) => void;
}

function Wheel({ items, initial, onChange }: WheelProps) {
  const ref = useRef<ScrollView>(null);
  const [selected, setSelected] = useState(initial);

  const handleEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, i));
      setSelected(clamped);
      onChange(clamped);
      ref.current?.scrollTo({ y: clamped * ITEM_H, animated: true });
    },
    [items.length, onChange],
  );

  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      contentContainerStyle={{ paddingVertical: PAD }}
      contentOffset={{ x: 0, y: initial * ITEM_H }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_H}
      decelerationRate={0.85}
      onMomentumScrollEnd={handleEnd}
      onScrollEndDrag={handleEnd}
    >
      {items.map((item, i) => (
        <View key={item} style={styles.item}>
          <Text style={[styles.itemText, i === selected && styles.itemSelected]}>
            {item}
          </Text>
        </View>
      ))}
    </ScrollView>
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
  wheel: {
    flex: 1,
  },
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
