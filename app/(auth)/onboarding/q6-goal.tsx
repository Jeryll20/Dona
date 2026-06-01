import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const OPTIONS: { key: string; label: string; icon: IoniconsName }[] = [
  { key: 'organise',  label: 'Me sentir mieux organisé·e', icon: 'albums-outline' },
  { key: 'activite',  label: 'Ajouter une activité',       icon: 'add-circle-outline' },
  { key: 'routine',   label: 'Créer une routine durable',  icon: 'refresh-outline' },
];

export default function Q6Goal() {
  const setWork = useUserStore((s) => s.setWork);
  const stored = useUserStore((s) => s.work);
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
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
        {OPTIONS.map((o) => {
          const active = selected === o.key;
          return (
            <TouchableOpacity
              key={o.key}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setSelected(o.key)}
              accessibilityLabel={o.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                <Ionicons
                  name={o.icon}
                  size={20}
                  color={active ? Colors.light.primaryStrong : Colors.light.ink2}
                />
              </View>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{o.label}</Text>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  optionActive: { borderWidth: 2, borderColor: Colors.light.primary },
  optionIcon: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  optionIconActive: { backgroundColor: Colors.light.primaryTint },
  optionLabel: { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink },
  optionLabelActive: { color: Colors.light.primaryStrong },
  radio: {
    width: 24, height: 24, borderRadius: Radius.pill,
    borderWidth: 2, borderColor: Colors.light.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  radioDot: { width: 10, height: 10, borderRadius: Radius.pill, backgroundColor: '#fff' },
});
