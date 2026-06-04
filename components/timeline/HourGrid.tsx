import { StyleSheet, View, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface HourGridProps {
  hourHeight: number;
}

export function HourGrid({ hourHeight }: HourGridProps) {
  const C = useColors();
  const s = makeStyles(C);
  return (
    <>
      {Array.from({ length: 25 }, (_, h) => (
        <View key={h} style={[s.row, { top: h * hourHeight }]}>
          <Text style={s.label} accessibilityElementsHidden>
            {h === 24 ? '00h' : `${String(h).padStart(2, '0')}h`}
          </Text>
          <View style={s.line} />
        </View>
      ))}
    </>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      position: 'absolute',
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      width: 40,
      textAlign: 'right',
      fontSize: 11,
      fontWeight: '600',
      color: C.ink3,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: C.hairline,
      opacity: 0.7,
    },
  });
}
