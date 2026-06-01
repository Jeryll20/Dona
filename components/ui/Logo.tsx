import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

interface LogoProps {
  size?: number;
}

// SVG viewport 132×124 — exact path from CLAUDE.md § Logo
const D_PATH =
  'M 10,0 L 56,0 C 97,0 122,28 122,62 C 122,96 97,124 56,124 L 10,124 Z ' +
  'M 38,23 L 54,23 C 78,23 96,40 96,62 C 96,84 78,101 54,101 L 38,101 ' +
  'C 38,90 39,85 47,79 C 57,71 62,65 62,57 C 62,49 57,43 47,37 C 39,32 38,23 38,23 Z';

export function Logo({ size = 40 }: LogoProps) {
  return (
    <LinearGradient
      colors={[Colors.light.primary, Colors.light.primaryStrong]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { width: size, height: size, borderRadius: size * 0.32 }]}
    >
      <View style={styles.inner}>
        <Svg width={size * 0.68} height={size * 0.68} viewBox="0 0 132 124">
          <Path fill="#fff" fillRule="evenodd" d={D_PATH} />
        </Svg>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: '#2E2048',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
