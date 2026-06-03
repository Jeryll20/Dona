import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

interface StepperProps {
  value: number;
  setValue: (v: number) => void;
  min: number;
  max: number;
  suffix?: string;
  step?: number;
}

export function Stepper({ value, setValue, min, max, suffix, step = 1 }: StepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[styles.btn, atMin && styles.btnOff]}
        onPress={() => setValue(Math.max(min, value - step))}
        disabled={atMin}
        accessibilityLabel="Diminuer"
      >
        <Text style={[styles.btnText, atMin && styles.btnTextOff]}>−</Text>
      </TouchableOpacity>

      <View style={styles.valWrap}>
        <Text style={styles.val}>{value}</Text>
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.btn, atMax && styles.btnOff]}
        onPress={() => setValue(Math.min(max, value + step))}
        disabled={atMax}
        accessibilityLabel="Augmenter"
      >
        <Text style={[styles.btnText, atMax && styles.btnTextOff]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  btn: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff:     { backgroundColor: Colors.light.surfaceSunk },
  btnText:    { fontSize: 28, fontWeight: '400', color: Colors.light.primaryStrong },
  btnTextOff: { color: Colors.light.ink3 },
  valWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  val:     { fontSize: 52, fontWeight: '700', color: Colors.light.ink, minWidth: 70, textAlign: 'center' },
  suffix:  { fontSize: 22, fontWeight: '500', color: Colors.light.ink3 },
});
