import {
  StyleSheet, View, Text, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { Sheet } from '@/components/ui/Sheet';
import { Stepper } from '@/components/ui/Stepper';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function dateToISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function Q9Cycle() {
  const setCycle = useUserStore((s) => s.setCycle);
  const stored   = useUserStore((s) => s.cycle);

  const [noMenstruation, setNoMenstruation] = useState(!stored.tracking && stored.tracking !== undefined ? true : false);
  const [lastDate,  setLastDate]  = useState<Date | null>(
    stored.lastPeriodDate ? new Date(stored.lastPeriodDate) : null,
  );
  const [cycleDays, setCycleDays] = useState(stored.cycleDays ?? 28);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  function openDatePicker() {
    setTempDate(lastDate ?? new Date());
    setShowPicker(true);
  }

  function confirmDate() {
    setLastDate(tempDate);
    setShowPicker(false);
  }

  function handleNext() {
    if (noMenstruation) {
      setCycle({ tracking: false });
    } else {
      setCycle({
        tracking: true,
        lastPeriodDate: lastDate ? dateToISO(lastDate) : undefined,
        cycleDays,
      });
    }
    router.push('/(auth)/onboarding/q6-goal');
  }

  return (
    <OnboardingShell
      step={8}
      eyebrow="Cycle menstruel"
      eyebrowIcon="flower-outline"
      question="Et ton cycle menstruel ?"
      sub="Ces informations permettent des conseils adaptés à chaque phase."
      onBack={() => router.push('/(auth)/onboarding/q8-other')}
      onNext={handleNext}
      scrollable
    >
      <View style={styles.container}>
        {/* No menstruation toggle */}
        <TouchableOpacity
          style={[styles.checkbox, noMenstruation && styles.checkboxActive]}
          onPress={() => setNoMenstruation(!noMenstruation)}
          accessibilityLabel="Je n'ai pas de menstruation"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: noMenstruation }}
        >
          <View style={[styles.checkMark, noMenstruation && styles.checkMarkActive]}>
            {noMenstruation && <Text style={styles.checkIcon}>✓</Text>}
          </View>
          <Text style={[styles.checkLabel, noMenstruation && styles.checkLabelActive]}>
            Je n'ai pas de menstruation
          </Text>
        </TouchableOpacity>

        {!noMenstruation && (
          <>
            {/* Last period date */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Date de tes dernières règles</Text>
              <TouchableOpacity
                style={styles.datePill}
                onPress={openDatePicker}
                accessibilityLabel="Sélectionner la date des dernières règles"
                accessibilityRole="button"
              >
                <Text style={[styles.datePillText, !lastDate && styles.datePillPlaceholder]}>
                  {lastDate ? formatDate(lastDate) : 'Touche pour choisir'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cycle duration */}
            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Durée de ton cycle</Text>
              <Stepper
                value={cycleDays}
                setValue={setCycleDays}
                min={21}
                max={40}
                suffix="jours"
              />
            </View>
          </>
        )}
      </View>

      <Sheet
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title="Dernières règles"
      >
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          onChange={(_, date) => { if (date) setTempDate(date); }}
          themeVariant="light"
          style={styles.datePicker}
        />
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={confirmDate}
          accessibilityLabel="Valider la date"
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },

  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  checkboxActive: {
    backgroundColor: Colors.light.primaryTint,
    borderColor: Colors.light.primary,
  },
  checkMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkIcon:  { fontSize: 13, color: '#fff', fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink2 },
  checkLabelActive: { color: Colors.light.primaryStrong },

  section: { gap: Spacing.sm },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  datePill: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    ...Shadow.sm,
  },
  datePillText:        { fontSize: FontSize.base, fontWeight: '500', color: Colors.light.ink },
  datePillPlaceholder: { color: Colors.light.ink3 },

  datePicker: { width: '100%' as any },

  confirmBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
});
