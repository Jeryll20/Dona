import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { useUserStore } from '@/store/useUserStore';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const STEPS = [
  'Analyse de ton rythme…',
  'Création de tes créneaux…',
  'Finalisation du planning…',
];

export default function CreationScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const completeOnboarding = useUserStore((st) => st.completeOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      completeOnboarding();
      router.push('/(auth)/onboarding/conversation');
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <View style={s.logoWrap}>
          <Logo size={72} />
        </View>
        <Text style={s.title}>Fabrication de{'\n'}ton planning</Text>
        <View style={s.steps}>
          {STEPS.map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.dot} />
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
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
      color: C.ink,
      letterSpacing: -0.8,
      textAlign: 'center',
      lineHeight: 38,
    },
    steps: { gap: Spacing.md, alignSelf: 'stretch', paddingHorizontal: Spacing.xl },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: C.primary,
    },
    stepText: { fontSize: FontSize.base, color: C.ink2, fontWeight: '500' },
  });
}
