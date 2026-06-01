import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';

interface HourGridProps {
  hourHeight: number;
}

export function HourGrid({ hourHeight }: HourGridProps) {
  return (
    <>
      {Array.from({ length: 25 }, (_, h) => (
        <View key={h} style={[styles.row, { top: h * hourHeight }]}>
          <Text style={styles.label} accessibilityElementsHidden>
            {h === 24 ? '00h' : `${String(h).padStart(2, '0')}h`}
          </Text>
          <View style={styles.line} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
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
    color: Colors.light.ink3,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.hairline,
    opacity: 0.7,
  },
});
