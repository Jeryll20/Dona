import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const STEPS = [
  'Analyse de ton rythme…',
  'Création de tes créneaux…',
  'Finalisation du planning…',
];

export default function CreationScreen() {
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      completeOnboarding();
      router.replace('/(tabs)/today');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <View style={styles.logoWrap}>
          <Logo size={72} />
        </View>
        <Text style={styles.title}>Fabrication de{'\n'}ton planning</Text>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.dot} />
              <Text style={styles.stepText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  logoWrap: { marginBottom: Spacing.sm },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: 38,
  },
  steps: { gap: Spacing.md, alignSelf: 'stretch', paddingHorizontal: Spacing.xl },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
  stepText: { fontSize: FontSize.base, color: Colors.light.ink2, fontWeight: '500' },
});
