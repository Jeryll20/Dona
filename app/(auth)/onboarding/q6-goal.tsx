import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { OptionRow } from '@/components/ui/OptionRow';
import { useUserStore } from '@/store/useUserStore';
import { Spacing } from '@/constants/spacing';

const OPTIONS = [
  { key: 'organise', label: 'Me sentir mieux organisé·e', icon: 'albums-outline'      as const },
  { key: 'activite', label: 'Ajouter une activité',       icon: 'add-circle-outline'  as const },
  { key: 'routine',  label: 'Créer une routine durable',  icon: 'refresh-outline'     as const },
];

export default function Q6Goal() {
  const setWork = useUserStore((s) => s.setWork);
  const stored  = useUserStore((s) => s.work);
  const [selected, setSelected] = useState<string>(stored.role ?? '');

  function handleNext() {
    setWork({ role: selected });
    router.push('/(auth)/onboarding/creation');
  }

  return (
    <OnboardingShell
      step={6}
      eyebrow="Objectif"
      eyebrowIcon="albums-outline"
      question="Quel est ton objectif principal ?"
      onNext={handleNext}
      nextDisabled={!selected}
      nextLabel="Créer mon planning"
    >
      <View style={styles.list}>
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.key}
            label={o.label}
            icon={o.icon}
            selected={selected === o.key}
            onPress={() => setSelected(o.key)}
          />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
});
