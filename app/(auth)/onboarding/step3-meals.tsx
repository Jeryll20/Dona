import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useUserStore } from '@/store/useUserStore';
import OnboardingShell from '@/components/onboarding/OnboardingShell';

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const DEFAULT_MEALS = ['08:00', '12:30', '19:30'];

export default function Step3Meals() {
  const setMeals = useUserStore((s) => s.setMeals);
  const stored = useUserStore((s) => s.meals);

  const [times, setTimes] = useState<string[]>(stored.times ?? DEFAULT_MEALS);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function updateTime(index: number, value: string) {
    const next = [...times];
    next[index] = value;
    setTimes(next);
    setOpenIndex(null);
  }

  function addMeal() {
    if (times.length < 6) setTimes([...times, '13:00']);
  }

  function removeMeal(index: number) {
    if (times.length > 1) setTimes(times.filter((_, i) => i !== index));
  }

  function handleNext() {
    setMeals({ times });
    router.push('/(auth)/onboarding/step4-sport');
  }

  return (
    <OnboardingShell
      step={3}
      totalSteps={7}
      title={Strings.onboarding.step3.title}
      onNext={handleNext}
    >
      <View style={styles.list}>
        {times.map((t, i) => (
          <View key={i}>
            <View style={styles.mealRow}>
              <Text style={styles.mealLabel}>{Strings.onboarding.step3.mealLabel(i + 1)}</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setOpenIndex(openIndex === i ? null : i)}
                accessibilityLabel={`Meal ${i + 1} time: ${t}`}
                accessibilityRole="button"
              >
                <Text style={styles.timeBtnText}>{t}</Text>
                <Text style={styles.timeChev}>{openIndex === i ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {times.length > 1 && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeMeal(i)}
                  accessibilityLabel={`Remove meal ${i + 1}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {openIndex === i && (
              <View style={styles.picker}>
                {TIMES.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.pickerOption, opt === t && styles.pickerOptionActive]}
                    onPress={() => updateTime(i, opt)}
                    accessibilityLabel={opt}
                  >
                    <Text style={[styles.pickerText, opt === t && styles.pickerTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ))}

        {times.length < 6 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={addMeal}
            accessibilityLabel={Strings.onboarding.step3.addMeal}
            accessibilityRole="button"
          >
            <Text style={styles.addText}>{Strings.onboarding.step3.addMeal}</Text>
          </TouchableOpacity>
        )}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    width: 56,
  },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  timeBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.ink,
  },
  timeChev: {
    fontSize: FontSize.xs,
    color: Colors.light.primary,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
  },
  picker: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    maxHeight: 180,
    marginTop: 4,
    ...Shadow.sm,
  },
  pickerOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  pickerOptionActive: {
    backgroundColor: Colors.light.primaryTint,
  },
  pickerText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink2,
    textAlign: 'center',
  },
  pickerTextActive: {
    fontWeight: '700',
    color: Colors.light.primaryStrong,
  },
  addBtn: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  addText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
