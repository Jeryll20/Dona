import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
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
  const C = useColors();
  const s = makeStyles(C);
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={[s.btn, atMin && s.btnOff]}
        onPress={() => setValue(Math.max(min, value - step))}
        disabled={atMin}
        accessibilityLabel="Diminuer"
      >
        <Text style={[s.btnText, atMin && s.btnTextOff]}>−</Text>
      </TouchableOpacity>

      <View style={s.valWrap}>
        <Text style={s.val}>{value}</Text>
        {suffix && <Text style={s.suffix}>{suffix}</Text>}
      </View>

      <TouchableOpacity
        style={[s.btn, atMax && s.btnOff]}
        onPress={() => setValue(Math.min(max, value + step))}
        disabled={atMax}
        accessibilityLabel="Augmenter"
      >
        <Text style={[s.btnText, atMax && s.btnTextOff]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
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
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnOff:     { backgroundColor: C.surfaceSunk },
    btnText:    { fontSize: 28, fontWeight: '400', color: C.primaryStrong },
    btnTextOff: { color: C.ink3 },
    valWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    val:     { fontSize: 52, fontWeight: '700', color: C.ink, minWidth: 70, textAlign: 'center' },
    suffix:  { fontSize: 22, fontWeight: '500', color: C.ink3 },
  });
}
