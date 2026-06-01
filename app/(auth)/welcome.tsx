import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';

export default function WelcomeScreen() {
  function handleStart() {
    router.push('/(auth)/onboarding/step1-personal');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>D</Text>
          </View>
          <Text style={styles.logoName}>{Strings.app.name}</Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.headline}>{Strings.onboarding.welcome.headline}</Text>
          <Text style={styles.body}>{Strings.onboarding.welcome.body}</Text>
        </View>

        <TouchableOpacity
          style={styles.cta}
          onPress={handleStart}
          accessibilityLabel={Strings.onboarding.welcome.cta}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{Strings.onboarding.welcome.cta}</Text>
          <Text style={styles.ctaArrow}>→</Text>
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
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    gap: Spacing['2xl'],
  },
  logoWrap: {
    alignItems: 'center',
    gap: Spacing.base,
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  logoLetter: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.light.onPrimary,
    lineHeight: 50,
  },
  logoName: {
    fontSize: FontSize['3xl'],
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -1,
  },
  textBlock: {
    gap: Spacing.md,
  },
  headline: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  body: {
    fontSize: FontSize.md,
    color: Colors.light.ink2,
    lineHeight: 24,
    textAlign: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing['2xl'],
    ...Shadow.md,
  },
  ctaText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.light.onPrimary,
    letterSpacing: 0.1,
  },
  ctaArrow: {
    fontSize: FontSize.lg,
    color: Colors.light.onPrimary,
  },
});
