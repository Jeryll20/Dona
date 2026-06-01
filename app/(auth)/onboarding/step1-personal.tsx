import { StyleSheet, View, Text, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useUserStore } from '@/store/useUserStore';
import OnboardingShell from '@/components/onboarding/OnboardingShell';

const TOTAL_STEPS = 7;

export default function Step1Personal() {
  const setProfile = useUserStore((s) => s.setProfile);
  const stored = useUserStore((s) => s.profile);

  const [fullName, setFullName] = useState(stored.fullName ?? '');
  const [email, setEmail] = useState(stored.email ?? '');

  function handleNext() {
    setProfile({ fullName, email });
    router.push('/(auth)/onboarding/step2-sleep');
  }

  const isValid = fullName.trim().length > 0 && email.includes('@');

  return (
    <OnboardingShell
      step={1}
      totalSteps={TOTAL_STEPS}
      title={Strings.onboarding.step1.title}
      onNext={handleNext}
      nextDisabled={!isValid}
    >
      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.label} accessibilityLabel={Strings.onboarding.step1.fullName}>
            {Strings.onboarding.step1.fullName}
          </Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Jane Doe"
            placeholderTextColor={Colors.light.ink3}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel={Strings.onboarding.step1.fullName}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{Strings.onboarding.step1.email}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={Colors.light.ink3}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            accessibilityLabel={Strings.onboarding.step1.email}
          />
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.base,
  },
  field: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.light.ink,
    ...Shadow.sm,
  },
});
