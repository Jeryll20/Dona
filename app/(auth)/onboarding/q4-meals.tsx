import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function Q4Meals() {
  const setMeals = useUserStore((s) => s.setMeals);
  const stored = useUserStore((s) => s.meals);
  const [meals, setMealsCount] = useState(stored.times?.length ?? 3);

  function handleNext() {
    const defaultTimes = ['08:00', '13:00', '19:30', '10:00', '16:00'];
    setMeals({ times: defaultTimes.slice(0, meals) });
    router.push('/(auth)/onboarding/q5-activities');
  }

  return (
    <OnboardingShell
      step={4}
      eyebrow="Repas"
      eyebrowIcon="restaurant-outline"
      question="Combien de repas prends-tu par jour ?"
      sub="On réserve un moment pour chacun dans ton planning."
      onNext={handleNext}
    >
      <View style={styles.stepper}>
        <TouchableOpacity
          style={[styles.stepBtn, meals <= 1 && styles.stepBtnOff]}
          onPress={() => setMealsCount((m) => Math.max(1, m - 1))}
          disabled={meals <= 1}
          accessibilityLabel="Diminuer"
        >
          <Text style={[styles.stepBtnText, meals <= 1 && styles.stepBtnTextOff]}>−</Text>
        </TouchableOpacity>

        <Text style={styles.value}>{meals}</Text>

        <TouchableOpacity
          style={[styles.stepBtn, meals >= 5 && styles.stepBtnOff]}
          onPress={() => setMealsCount((m) => Math.min(5, m + 1))}
          disabled={meals >= 5}
          accessibilityLabel="Augmenter"
        >
          <Text style={[styles.stepBtnText, meals >= 5 && styles.stepBtnTextOff]}>+</Text>
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
  value: { fontSize: 52, fontWeight: '700', color: Colors.light.ink, minWidth: 70, textAlign: 'center' },
});
