import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';

export default function Q4Meals() {
  const setMeals = useUserStore((s) => s.setMeals);
  const stored   = useUserStore((s) => s.meals);
  const [count, setCount] = useState(stored.times?.length ?? 3);

  function handleNext() {
    const defaultTimes = ['08:00', '13:00', '19:30', '10:00', '16:00'];
    setMeals({ times: defaultTimes.slice(0, count) });
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
      <Stepper value={count} setValue={setCount} min={1} max={5} />
    </OnboardingShell>
  );
}
