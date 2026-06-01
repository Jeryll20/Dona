import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { OptionRow } from '@/components/ui/OptionRow';
import { useUserStore } from '@/store/useUserStore';
import { Spacing } from '@/constants/spacing';

const OPTIONS = [
  { key: '60', label: "J'ai besoin de temps",    sub: '≈ 1h le matin',  icon: 'time-outline'  as const },
  { key: '40', label: 'Je suis un peu organisé·e', sub: '≈ 40 min',      icon: 'time-outline'  as const },
  { key: '20', label: 'Je me lève direct',          sub: '≈ 20 min',     icon: 'flash-outline' as const },
];

export default function Q3MorningPrep() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored   = useUserStore((s) => s.sleep);
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
        {OPTIONS.map((o) => (
          <OptionRow
            key={o.key}
            label={o.label}
            sub={o.sub}
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
