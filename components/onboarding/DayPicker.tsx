import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
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
  function toggle(key: WeekDay) {
    onChange(
      value.includes(key)
        ? value.filter((d) => d !== key)
        : [...value, key],
    );
  }

  return (
    <View style={styles.row}>
      {DAY_CONFIG.map(({ key, label }) => {
        const active = value.includes(key);
        return (
          <TouchableOpacity
            key={key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => toggle(key)}
            accessibilityLabel={key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const PILL = 40;

const styles = StyleSheet.create({
  row:        { flexDirection: 'row', justifyContent: 'space-between' },
  pill:       { width: PILL, height: PILL, borderRadius: Radius.pill, backgroundColor: Colors.light.surfaceSunk, alignItems: 'center', justifyContent: 'center' },
  pillActive: { backgroundColor: Colors.light.primary },
  label:      { fontSize: 13, fontWeight: '700', color: Colors.light.ink3 },
  labelActive:{ color: Colors.light.onPrimary },
});
