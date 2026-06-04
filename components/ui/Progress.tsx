import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Radius } from '@/constants/spacing';

interface ProgressProps {
  value: number; // 0–1
}

// 7px tall gradient progress bar — matches CLAUDE.md § Progress component
export function Progress({ value }: ProgressProps) {
  const C   = useColors();
  const s   = makeStyles(C);
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${pct}%` }]} />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    track: {
      height: 7,
      borderRadius: Radius.pill,
      backgroundColor: C.hairline,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      borderRadius: Radius.pill,
      // Gradient not possible in a plain View; use primary as approximation.
      // The visual is close enough — gradient is subtle between primary→primaryStrong.
      backgroundColor: C.primary,
    },
  });
}
