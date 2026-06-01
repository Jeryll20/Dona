import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 44 }: LogoProps) {
  const radius = size * 0.32;
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.52, lineHeight: size * 0.65 }]}>D</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  letter: {
    color: '#fff',
    fontWeight: '800',
    includeFontPadding: false,
  },
});
