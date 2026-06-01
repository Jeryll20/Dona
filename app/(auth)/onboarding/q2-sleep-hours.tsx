import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function Q2SleepHours() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored = useUserStore((s) => s.sleep);
  const [hours, setHours] = useState(stored.sleepHours ?? 8);

  function handleNext() {
    setSleep({ sleepHours: hours });
    router.push('/(auth)/onboarding/q3-morning-prep');
  }

  return (
    <OnboardingShell
      step={2}
      eyebrow="Sommeil"
      eyebrowIcon="moon-outline"
      question="Combien d'heures aimerais-tu dormir ?"
      sub="On garde ce créneau protégé dans ta journée."
      onNext={handleNext}
    >
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepBtn, hours <= 5 && styles.stepBtnOff]}
          onPress={() => setHours((h) => Math.max(5, h - 1))}
          disabled={hours <= 5}
          accessibilityLabel="Diminuer"
        >
          <Text style={[styles.stepBtnText, hours <= 5 && styles.stepBtnTextOff]}>−</Text>
        </TouchableOpacity>

        <Text style={styles.value}>
          {hours}
          <Text style={styles.suffix}>h</Text>
        </Text>

        <TouchableOpacity
          style={[styles.stepBtn, hours >= 11 && styles.stepBtnOff]}
          onPress={() => setHours((h) => Math.min(11, h + 1))}
          disabled={hours >= 11}
          accessibilityLabel="Augmenter"
        >
          <Text style={[styles.stepBtnText, hours >= 11 && styles.stepBtnTextOff]}>+</Text>
        </TouchableOpacity>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2xl'],
    paddingVertical: Spacing.xl,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnOff: { backgroundColor: Colors.light.surfaceSunk },
  stepBtnText: { fontSize: 28, fontWeight: '400', color: Colors.light.primaryStrong },
  stepBtnTextOff: { color: Colors.light.ink3 },
  value: { fontSize: 52, fontWeight: '700', color: Colors.light.ink, minWidth: 90, textAlign: 'center' },
  suffix: { fontSize: 22, fontWeight: '500', color: Colors.light.ink3 },
});
