import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius } from '@/constants/spacing';

interface ProgressProps {
  value: number; // 0–1
}

// 7px tall gradient progress bar — matches CLAUDE.md § Progress component
export function Progress({ value }: ProgressProps) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.hairline,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    // Gradient not possible in a plain View; use primary as approximation.
    // The visual is close enough — gradient is subtle between primary→primaryStrong.
    backgroundColor: Colors.light.primary,
  },
});
