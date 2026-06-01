import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '@/components/ui/Logo';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const FEATURES: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'moon-outline',       label: 'Ton rythme de sommeil' },
  { icon: 'restaurant-outline', label: 'Tes repas de la journée' },
  { icon: 'walk-outline',       label: 'Tes activités favorites' },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.logoRow}>
            <Logo size={44} />
            <Text style={styles.logoName}>Dona</Text>
          </View>

          <Text style={styles.headline}>
            Bienvenue dans{'\n'}ton nouvel espace.
          </Text>
          <Text style={styles.body}>
            Dona t'aide à mieux gérer ton temps, sans te surcharger.
            Réponds à quelques questions et on te propose un planning
            qui te ressemble.
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon} size={21} color={Colors.light.primaryStrong} />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/(auth)/onboarding/q1-bedtime')}
          accessibilityLabel="On y va ?"
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>On y va ?</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    color: Colors.light.ink,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -1,
    lineHeight: 42,
  },
  body: {
    fontSize: FontSize.md,
    lineHeight: 24,
    color: Colors.light.ink2,
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
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  featureLabel: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
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
