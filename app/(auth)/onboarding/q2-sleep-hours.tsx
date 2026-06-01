import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';

export default function Q2SleepHours() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored   = useUserStore((s) => s.sleep);
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
      <Stepper value={hours} setValue={setHours} min={5} max={11} suffix="h" />
    </OnboardingShell>
  );
}
