import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { OptionRow } from '@/components/ui/OptionRow';
import { useUserStore } from '@/store/useUserStore';
import { Spacing } from '@/constants/spacing';

const OPTIONS = [
  { key: 'Travail',       label: 'Travail',       icon: 'briefcase-outline'    as const },
  { key: 'Apprentissage', label: 'Apprentissage',  icon: 'book-outline'         as const },
  { key: 'Sport',         label: 'Sport',          icon: 'walk-outline'         as const },
  { key: 'Culture',       label: 'Culture',        icon: 'color-palette-outline' as const },
  { key: 'Autre',         label: 'Autre',          icon: 'sparkles-outline'     as const },
];

export default function Q5Activities() {
  const setSport = useUserStore((s) => s.setSport);
  const stored   = useUserStore((s) => s.sport);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(stored.activity ? stored.activity.split(', ').filter(Boolean) : []),
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
      scrollable
      onNext={handleNext}
    >
      <View style={styles.list}>
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.key}
            label={o.label}
            icon={o.icon}
            selected={selected.has(o.key)}
            multi
            onPress={() => toggle(o.key)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
});
