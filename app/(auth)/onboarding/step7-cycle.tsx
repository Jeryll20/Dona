import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useUserStore } from '@/store/useUserStore';
import OnboardingShell from '@/components/onboarding/OnboardingShell';

const CYCLE_DAYS = Array.from({ length: 15 }, (_, i) => i + 21); // 21–35

export default function Step7Cycle() {
  const setCycle = useUserStore((s) => s.setCycle);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const stored = useUserStore((s) => s.cycle);

  const [noMenstruation, setNoMenstruation] = useState(!stored.tracking && stored.cycleDays === 0);
  const [cycleDays, setCycleDays] = useState(stored.cycleDays || 28);
  const [lastPeriod, setLastPeriod] = useState(stored.lastPeriodDate ?? '');

  function handleFinish() {
    setCycle({
      tracking: !noMenstruation,
      cycleDays: noMenstruation ? 0 : cycleDays,
      lastPeriodDate: noMenstruation ? undefined : lastPeriod || undefined,
    });
    completeOnboarding();
    router.replace('/(tabs)/today');
  }

  return (
    <OnboardingShell
      step={7}
      totalSteps={7}
      title={Strings.onboarding.step7.title}
      onNext={handleFinish}
    >
      <TouchableOpacity
        style={[styles.noMensOption, noMenstruation && styles.noMensOptionActive]}
        onPress={() => setNoMenstruation((v) => !v)}
        accessibilityLabel={Strings.onboarding.step7.noMenstruation}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: noMenstruation }}
      >
        <Text style={[styles.noMensText, noMenstruation && styles.noMensTextActive]}>
          {Strings.onboarding.step7.noMenstruation}
        </Text>
        <View style={[styles.checkbox, noMenstruation && styles.checkboxActive]}>
          {noMenstruation && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      {!noMenstruation && (
        <View style={styles.options}>
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.onboarding.step7.cycleDuration}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={[styles.stepBtn, cycleDays <= 21 && styles.stepBtnDisabled]}
                onPress={() => setCycleDays((d) => Math.max(21, d - 1))}
                disabled={cycleDays <= 21}
                accessibilityLabel="Decrease cycle days"
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>
                {cycleDays}
                <Text style={styles.stepSuffix}> {Strings.onboarding.step7.cycleSuffix}</Text>
              </Text>
              <TouchableOpacity
                style={[styles.stepBtn, cycleDays >= 35 && styles.stepBtnDisabled]}
                onPress={() => setCycleDays((d) => Math.min(35, d + 1))}
                disabled={cycleDays >= 35}
                accessibilityLabel="Increase cycle days"
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  noMensOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  noMensOptionActive: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  noMensText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.light.ink,
  },
  noMensTextActive: {
    color: Colors.light.primaryStrong,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.light.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary,
  },
  checkmark: {
    fontSize: 14,
    color: Colors.light.onPrimary,
    fontWeight: '700',
  },
  options: {
    gap: Spacing.base,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    letterSpacing: 0.2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: Colors.light.surfaceSunk,
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '500',
    color: Colors.light.primaryStrong,
  },
  stepValue: {
    fontSize: 44,
    fontWeight: '700',
    color: Colors.light.ink,
    minWidth: 80,
    textAlign: 'center',
  },
  stepSuffix: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.ink3,
  },
});
