import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';

export default function Q3MorningPrep() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored   = useUserStore((s) => s.sleep);
  const [minutes, setMinutes] = useState(stored.prepMinutes ?? 40);

  function handleNext() {
    setSleep({ prepMinutes: minutes });
    router.push('/(auth)/onboarding/q4-meals');
  }

  return (
    <OnboardingShell
      step={3}
      eyebrow="Préparation"
      eyebrowIcon="flash-outline"
      question="Combien de temps pour te préparer le matin ?"
      sub="Douche, petit-déjeuner, habillage — tout compris."
      onBack={() => router.push('/(auth)/onboarding/q1-bedtime')}
      onNext={handleNext}
    >
      <Stepper
        value={minutes}
        setValue={setMinutes}
        min={5}
        max={120}
        step={5}
        suffix="min"
      />
    </OnboardingShell>
  );
}
