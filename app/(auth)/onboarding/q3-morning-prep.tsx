import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const OPTIONS = [
  { key: '60', label: "J'ai besoin de temps", sub: '≈ 1h le matin',         icon: 'time-outline' as const },
  { key: '40', label: "Je suis un peu organisé·e", sub: '≈ 40 min',          icon: 'time-outline' as const },
  { key: '20', label: 'Je me lève direct',           sub: '≈ 20 min',         icon: 'flash-outline' as const },
];

export default function Q3MorningPrep() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored = useUserStore((s) => s.sleep);
  const [selected, setSelected] = useState<string>(String(stored.prepMinutes ?? '40'));

  function handleNext() {
    setSleep({ prepMinutes: parseInt(selected, 10) });
    router.push('/(auth)/onboarding/q4-meals');
  }

  return (
    <OnboardingShell
      step={3}
      eyebrow="Préparation"
      eyebrowIcon="flash-outline"
      question="Le matin, combien de temps pour te préparer ?"
      onNext={handleNext}
      nextDisabled={!selected}
    >
      <View style={styles.list}>
        {OPTIONS.map((o) => {
          const active = selected === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(o.key)}
              accessibilityLabel={o.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                <Ionicons
                  name={o.icon}
                  size={20}
                  color={active ? Colors.light.primaryStrong : Colors.light.ink2}
                />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{o.label}</Text>
                <Text style={styles.optionSub}>{o.sub}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  optionActive: { borderWidth: 2, borderColor: Colors.light.primary },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIconActive: { backgroundColor: Colors.light.primaryTint },
  optionText: { flex: 1 },
  optionLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  optionLabelActive: { color: Colors.light.primaryStrong },
  optionSub: { fontSize: FontSize.sm, color: Colors.light.ink3, marginTop: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Colors.light.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  radioDot: { width: 10, height: 10, borderRadius: Radius.pill, backgroundColor: '#fff' },
});
