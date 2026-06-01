import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
});

export default function Q1Bedtime() {
  const setSleep = useUserStore((s) => s.setSleep);
  const stored = useUserStore((s) => s.sleep);
  const [bedtime, setBedtime] = useState(stored.bedtime ?? '23:00');
  const [open, setOpen] = useState(false);

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
      <View style={styles.center}>
        <TouchableOpacity
          style={styles.timeBtn}
          onPress={() => setOpen((o) => !o)}
          accessibilityLabel={`Heure de coucher : ${bedtime}`}
          accessibilityRole="button"
        >
          <Text style={styles.timeText}>{bedtime}</Text>
          <Text style={styles.timeChev}>{open ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {open && (
          <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
            {TIMES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pickerRow, t === bedtime && styles.pickerRowActive]}
                onPress={() => { setBedtime(t); setOpen(false); }}
                accessibilityLabel={t}
              >
                <Text style={[styles.pickerText, t === bedtime && styles.pickerTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: Spacing.base },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  timeText: { fontSize: 36, fontWeight: '700', color: Colors.light.ink },
  timeChev: { fontSize: FontSize.sm, color: Colors.light.primary },
  picker: {
    width: 160,
    maxHeight: 220,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.card,
    ...Shadow.md,
  },
  pickerRow: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  pickerRowActive: { backgroundColor: Colors.light.primaryTint },
  pickerText: { fontSize: FontSize.base, fontWeight: '500', color: Colors.light.ink2, textAlign: 'center' },
  pickerTextActive: { fontWeight: '700', color: Colors.light.primaryStrong },
});
