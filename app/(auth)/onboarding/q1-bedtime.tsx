import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';

export default function Q1Bedtime() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored   = useUserStore((s) => s.sleep);
  const [bedtime, setBedtime] = useState(stored.bedtime ?? '23:00');

  function handleNext() {
    setSleep({ bedtime });
    router.push('/(auth)/onboarding/q2-sleep-hours');
  }

  return (
    <OnboardingShell
      step={1}
      eyebrow="Sommeil"
      eyebrowIcon="moon-outline"
      question="À quelle heure te couches-tu en général ?"
      sub="C'est important pour adapter tes journées à ton rythme naturel."
      footer="Tu pourras modifier tout ça à tout moment depuis ton profil."
      onBack={() => router.push('/(auth)/welcome')}
      onNext={handleNext}
    >
      <TimeField value={bedtime} onChange={setBedtime} />
    </OnboardingShell>
  );
}
