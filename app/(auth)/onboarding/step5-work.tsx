import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useUserStore } from '@/store/useUserStore';
import OnboardingShell from '@/components/onboarding/OnboardingShell';

type Choice = 'yes' | 'no' | 'interested';

export default function Step5Work() {
  const setWork = useUserStore((s) => s.setWork);
  const stored = useUserStore((s) => s.work);

  const [choice, setChoice] = useState<Choice>(
    stored.employed ? 'yes' : stored.interested ? 'interested' : 'no'
  );
  const [role, setRole] = useState(stored.role ?? '');
  const [schedule, setSchedule] = useState(stored.schedule ?? '');
  const [location, setLocation] = useState(stored.location ?? '');

  function handleNext() {
    setWork({
      employed: choice === 'yes',
      interested: choice === 'interested',
      role: choice !== 'no' ? role : undefined,
      schedule: choice !== 'no' ? schedule : undefined,
      location: choice !== 'no' ? location : undefined,
    });
    router.push('/(auth)/onboarding/step6-activities');
  }

  const opts: { key: Choice; label: string }[] = [
    { key: 'yes', label: Strings.onboarding.step5.yes },
    { key: 'no', label: Strings.onboarding.step5.no },
    { key: 'interested', label: Strings.onboarding.step5.wouldLike },
  ];

  return (
    <OnboardingShell
      step={5}
      totalSteps={7}
      title={Strings.onboarding.step5.title}
      onNext={handleNext}
    >
      <View style={styles.choices}>
        {opts.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={[styles.choice, choice === o.key && styles.choiceActive]}
            onPress={() => setChoice(o.key)}
            accessibilityLabel={o.label}
            accessibilityRole="radio"
            accessibilityState={{ selected: choice === o.key }}
          >
            <Text style={[styles.choiceText, choice === o.key && styles.choiceTextActive]}>
              {o.label}
            </Text>
            <View style={[styles.radio, choice === o.key && styles.radioActive]}>
              {choice === o.key && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {choice !== 'no' && (
        <View style={styles.details}>
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.onboarding.step5.what}</Text>
            <TextInput
              style={styles.input}
              value={role}
              onChangeText={setRole}
              placeholder="Software developer, designer…"
              placeholderTextColor={Colors.light.ink3}
              accessibilityLabel={Strings.onboarding.step5.what}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.onboarding.step5.when}</Text>
            <TextInput
              style={styles.input}
              value={schedule}
              onChangeText={setSchedule}
              placeholder="Mon–Fri 09:00–18:00"
              placeholderTextColor={Colors.light.ink3}
              accessibilityLabel={Strings.onboarding.step5.when}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>{Strings.onboarding.step5.where}</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Office, remote, hybrid…"
              placeholderTextColor={Colors.light.ink3}
              accessibilityLabel={Strings.onboarding.step5.where}
            />
          </View>
        </View>
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  choices: { gap: Spacing.md },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  choiceActive: { borderWidth: 2, borderColor: Colors.light.primary },
  choiceText: { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  choiceTextActive: { color: Colors.light.primaryStrong },
  radio: {
    width: 24, height: 24, borderRadius: Radius.pill,
    borderWidth: 2, borderColor: Colors.light.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  radioDot: { width: 10, height: 10, borderRadius: Radius.pill, backgroundColor: Colors.light.onPrimary },
  details: { gap: Spacing.base, marginTop: Spacing.sm },
  field: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.light.ink3, letterSpacing: 0.2 },
  input: {
    backgroundColor: Colors.light.surface, borderRadius: Radius.input,
    padding: Spacing.base, fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink, ...Shadow.sm,
  },
});
