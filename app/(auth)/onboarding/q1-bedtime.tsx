import { StyleSheet, View, Text } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function Q1Bedtime() {
  const C = useColors();
  const s = makeStyles(C);
  const setSleep = useUserStore((st) => st.setSleep);
  const stored   = useUserStore((st) => st.sleep);

  const [bedtime,  setBedtime]  = useState(stored.bedtime  ?? '23:00');
  const [waketime, setWaketime] = useState(stored.waketime ?? '07:00');

  function handleNext() {
    setSleep({ bedtime, waketime });
    router.push('/(auth)/onboarding/q3-morning-prep');
  }

  return (
    <OnboardingShell
      step={2}
      eyebrow="Sommeil"
      eyebrowIcon="moon-outline"
      question="Quels sont tes horaires habituels de sommeil ?"
      sub="Coucher et réveil — on adaptera ton planning à ton rythme naturel."
      footer="Tu pourras modifier ça depuis ton profil à tout moment."
      onBack={() => router.push('/(auth)/onboarding/personal-info')}
      onNext={handleNext}
      scrollable
    >
      <View style={s.container}>
        <View style={s.block}>
          <Text style={s.fieldLabel}>Je me couche à</Text>
          <TimeField value={bedtime} onChange={setBedtime} />
        </View>
        <View style={s.divider} />
        <View style={s.block}>
          <Text style={s.fieldLabel}>Je me lève à</Text>
          <TimeField value={waketime} onChange={setWaketime} />
        </View>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { gap: Spacing.lg },
    block:     { gap: Spacing.sm },
    fieldLabel: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: C.ink3,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    divider: {
      height: 1,
      backgroundColor: C.hairline,
      marginVertical: Spacing.xs,
    },
  });
}
