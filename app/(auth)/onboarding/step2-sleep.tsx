import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useUserStore } from '@/store/useUserStore';
import OnboardingShell from '@/components/onboarding/OnboardingShell';

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

const PREP_OPTIONS = [15, 20, 30, 45, 60, 90];

function TimeSelector({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.timeWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.timeBtn}
        onPress={() => setOpen((o) => !o)}
        accessibilityLabel={`${label}: ${value}`}
        accessibilityRole="button"
      >
        <Text style={styles.timeBtnText}>{value}</Text>
        <Text style={styles.timeChev}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.picker}>
          {TIMES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.pickerOption, t === value && styles.pickerOptionActive]}
              onPress={() => { onChange(t); setOpen(false); }}
              accessibilityLabel={t}
            >
              <Text style={[styles.pickerText, t === value && styles.pickerTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function Step2Sleep() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored = useUserStore((s) => s.sleep);

  const [bedtime, setBedtime] = useState(stored.bedtime ?? '23:00');
  const [wakeTime, setWakeTime] = useState(stored.wakeTime ?? '07:00');
  const [prep, setPrep] = useState(stored.prepMinutes ?? 30);

  function handleNext() {
    setSleep({ bedtime, wakeTime, prepMinutes: prep });
    router.push('/(auth)/onboarding/step3-meals');
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={7}
      title={Strings.onboarding.step2.title}
      onNext={handleNext}
    >
      <TimeSelector
        label={Strings.onboarding.step2.bedtime}
        value={bedtime}
        onChange={setBedtime}
      />
      <TimeSelector
        label={Strings.onboarding.step2.wakeUp}
        value={wakeTime}
        onChange={setWakeTime}
      />

      <View style={styles.prepSection}>
        <Text style={styles.fieldLabel}>{Strings.onboarding.step2.prepTime}</Text>
        <View style={styles.prepRow}>
          {PREP_OPTIONS.map((min) => (
            <TouchableOpacity
              key={min}
              style={[styles.prepChip, prep === min && styles.prepChipActive]}
              onPress={() => setPrep(min)}
              accessibilityLabel={`${min} ${Strings.onboarding.step2.prepSuffix}`}
            >
              <Text style={[styles.prepChipText, prep === min && styles.prepChipTextActive]}>
                {min} {Strings.onboarding.step2.prepSuffix}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  timeWrap: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    letterSpacing: 0.2,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  timeBtnText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.ink,
  },
  timeChev: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
  },
  picker: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    maxHeight: 200,
    overflow: 'scroll',
    ...Shadow.sm,
  },
  pickerOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  pickerOptionActive: {
    backgroundColor: Colors.light.primaryTint,
  },
  pickerText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink2,
    textAlign: 'center',
  },
  pickerTextActive: {
    fontWeight: '700',
    color: Colors.light.primaryStrong,
  },
  prepSection: {
    gap: Spacing.sm,
  },
  prepRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  prepChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    ...Shadow.sm,
  },
  prepChipActive: {
    backgroundColor: Colors.light.primary,
  },
  prepChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.ink2,
  },
  prepChipTextActive: {
    color: Colors.light.onPrimary,
  },
});
