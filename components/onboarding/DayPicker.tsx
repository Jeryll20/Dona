import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Radius } from '@/constants/spacing';
import type { WeekDay } from '@/types';

const DAY_CONFIG: { key: WeekDay; label: string }[] = [
  { key: 'Mon', label: 'L' },
  { key: 'Tue', label: 'M' },
  { key: 'Wed', label: 'M' },
  { key: 'Thu', label: 'J' },
  { key: 'Fri', label: 'V' },
  { key: 'Sat', label: 'S' },
  { key: 'Sun', label: 'D' },
];

interface DayPickerProps {
  value: WeekDay[];
  onChange: (days: WeekDay[]) => void;
}

export function DayPicker({ value, onChange }: DayPickerProps) {
  const C = useColors();
  const s = makeStyles(C);

  function toggle(key: WeekDay) {
    onChange(
      value.includes(key)
        ? value.filter((d) => d !== key)
        : [...value, key],
    );
  }

  return (
    <View style={s.row}>
      {DAY_CONFIG.map(({ key, label }) => {
        const active = value.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={[s.pill, active && s.pillActive]}
            onPress={() => toggle(key)}
            accessibilityLabel={key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <Text style={[s.label, active && s.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const PILL = 40;

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row:        { flexDirection: 'row', justifyContent: 'space-between' },
    pill:       { width: PILL, height: PILL, borderRadius: Radius.pill, backgroundColor: C.surfaceSunk, alignItems: 'center', justifyContent: 'center' },
    pillActive: { backgroundColor: C.primary },
    label:      { fontSize: 13, fontWeight: '700', color: C.ink3 },
    labelActive:{ color: C.onPrimary },
  });
}
