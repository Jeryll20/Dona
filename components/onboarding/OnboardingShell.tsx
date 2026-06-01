import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';

interface OnboardingShellProps {
  step: number;
  totalSteps: number;
  title: string;
  onNext: () => void;
  nextDisabled?: boolean;
  children: React.ReactNode;
}

export default function OnboardingShell({
  step,
  totalSteps,
  title,
  onNext,
  nextDisabled,
  children,
}: OnboardingShellProps) {
  const progress = step / totalSteps;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        {step > 1 ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel={Strings.onboarding.back}
            accessibilityRole="button"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.stepCount}>{step}/{totalSteps}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, nextDisabled && styles.nextBtnDisabled]}
          onPress={onNext}
          disabled={nextDisabled}
          accessibilityLabel={
            step === 7 ? Strings.onboarding.finish : Strings.onboarding.next
          }
          accessibilityRole="button"
        >
          <Text style={[styles.nextText, nextDisabled && styles.nextTextDisabled]}>
            {step === 7 ? Strings.onboarding.finish : Strings.onboarding.next}
          </Text>
          <Text style={[styles.nextArrow, nextDisabled && styles.nextTextDisabled]}>→</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  backArrow: {
    fontSize: 24,
    color: Colors.light.ink2,
    lineHeight: 28,
    marginTop: -2,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primary,
  },
  stepCount: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    minWidth: 32,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.5,
  },
  body: {
    gap: Spacing.base,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    ...Shadow.md,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.light.surfaceSunk,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.light.onPrimary,
    letterSpacing: 0.1,
  },
  nextTextDisabled: {
    color: Colors.light.ink3,
  },
  nextArrow: {
    fontSize: FontSize.lg,
    color: Colors.light.onPrimary,
  },
});
