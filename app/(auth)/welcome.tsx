import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'moon-outline',       label: 'Ton rythme de sommeil' },
  { icon: 'restaurant-outline', label: 'Tes repas de la journée' },
  { icon: 'walk-outline',       label: 'Tes activités favorites' },
];

export default function WelcomeScreen() {
  const C = useColors();
  const s = makeStyles(C);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.top}>
          <View style={s.logoRow}>
            <Logo size={44} />
            <Text style={s.logoName}>Dona</Text>
          </View>

          <Text style={s.headline}>
            Bienvenue dans{'\n'}ton nouvel espace.
          </Text>
          <Text style={s.body}>
            Dona t'aide à mieux gérer ton temps, sans te surcharger.
            Réponds à quelques questions et on te propose un planning
            qui te ressemble.
          </Text>

          <View style={s.featureList}>
            {FEATURES.map((f) => (
              <View key={f.label} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <Ionicons name={f.icon} size={21} color={C.primaryStrong} />
                </View>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={s.cta}
          onPress={() => router.push('/(auth)/onboarding/personal-info')}
          accessibilityLabel="On y va ?"
          accessibilityRole="button"
        >
          <Text style={s.ctaText}>On y va ?</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: C.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing['4xl'],
      paddingBottom: Spacing['2xl'],
      justifyContent: 'space-between',
    },
    top: {
      gap: Spacing.lg,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    logoName: {
      fontSize: FontSize['2xl'],
      fontWeight: '800',
      color: C.ink,
      letterSpacing: -0.5,
    },
    headline: {
      fontSize: 38,
      fontWeight: '800',
      color: C.ink,
      letterSpacing: -1,
      lineHeight: 42,
    },
    body: {
      fontSize: FontSize.md,
      lineHeight: 24,
      color: C.ink2,
    },
    featureList: {
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    featureIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadow.sm,
    },
    featureLabel: {
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.base + 2,
      ...Shadow.md,
    },
    ctaText: {
      fontSize: FontSize.base,
      fontWeight: '600',
      color: '#fff',
      letterSpacing: 0.1,
    },
  });
}
