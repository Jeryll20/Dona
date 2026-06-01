import { StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';

interface NowIndicatorProps {
  nowHour: number;
  hourHeight: number;
}

export function NowIndicator({ nowHour, hourHeight }: NowIndicatorProps) {
  return (
    <View
      style={[styles.row, { top: nowHour * hourHeight }]}
      accessibilityLabel="Heure actuelle"
    >
      <View style={styles.dot} />
      <View style={styles.track} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 42,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 5,
  },
  dot:   { width: 9, height: 9, borderRadius: 999, backgroundColor: Colors.light.primary },
  track: { flex: 1, height: 2, backgroundColor: Colors.light.primary, opacity: 0.55, borderRadius: 2 },
});
