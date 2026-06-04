import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface NowIndicatorProps {
  nowHour: number;
  hourHeight: number;
}

export function NowIndicator({ nowHour, hourHeight }: NowIndicatorProps) {
  const C = useColors();
  const s = makeStyles(C);
  return (
    <View
      style={[s.row, { top: nowHour * hourHeight }]}
      accessibilityLabel="Heure actuelle"
    >
      <View style={s.dot} />
      <View style={s.track} />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      position: 'absolute',
      left: 42,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 5,
    },
    dot:   { width: 9, height: 9, borderRadius: 999, backgroundColor: C.primary },
    track: { flex: 1, height: 2, backgroundColor: C.primary, opacity: 0.55, borderRadius: 2 },
  });
}
