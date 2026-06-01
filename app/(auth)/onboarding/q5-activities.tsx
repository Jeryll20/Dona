import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const OPTIONS: { key: string; label: string; icon: IoniconsName }[] = [
  { key: 'Travail',       label: 'Travail',       icon: 'briefcase-outline' },
  { key: 'Apprentissage', label: 'Apprentissage',  icon: 'book-outline' },
  { key: 'Sport',         label: 'Sport',          icon: 'walk-outline' },
  { key: 'Culture',       label: 'Culture',        icon: 'color-palette-outline' },
  { key: 'Autre',         label: 'Autre',          icon: 'sparkles-outline' },
];

export default function Q5Activities() {
  const setSport = useUserStore((s) => s.setSport);
  const stored = useUserStore((s) => s.sport);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(stored.activity ? [stored.activity] : [])
  );

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleNext() {
    setSport({ activity: [...selected].join(', '), active: selected.size > 0 });
    router.push('/(auth)/onboarding/q6-goal');
  }

  return (
    <OnboardingShell
      step={5}
      eyebrow="Activités"
      eyebrowIcon="walk-outline"
      question="Quels types d'activités pratiques-tu ?"
      sub="Plusieurs choix possibles."
      onNext={handleNext}
    >
      <View style={styles.list}>
        {OPTIONS.map((o) => {
          const active = selected.has(o.key);
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => toggle(o.key)}
              accessibilityLabel={o.label}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active }}
            >
              <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                <Ionicons
                  name={o.icon}
                  size={20}
                  color={active ? Colors.light.primaryStrong : Colors.light.ink2}
                />
              </View>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{o.label}</Text>
              <View style={[styles.checkbox, active && styles.checkboxActive]}>
                {active && <Ionicons name="checkmark" size={14} color="#fff" />}
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
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optionIconActive: { backgroundColor: Colors.light.primaryTint },
  optionLabel: { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  optionLabelActive: { color: Colors.light.primaryStrong },
  checkbox: {
    width: 24, height: 24, borderRadius: 7,
    borderWidth: 2, borderColor: Colors.light.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
});
