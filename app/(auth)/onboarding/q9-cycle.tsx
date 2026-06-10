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
import { useColors, useIsDark } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // local date — avoids UTC previous-day shift
}

export default function Q9Cycle() {
  const C = useColors();
  const isDark = useIsDark();
  const s = makeStyles(C);
  const setCycle = useUserStore((st) => st.setCycle);
  const stored   = useUserStore((st) => st.cycle);

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
      <View style={s.container}>
        {/* No menstruation toggle */}
        <TouchableOpacity
          style={[s.checkbox, noMenstruation && s.checkboxActive]}
          onPress={() => setNoMenstruation(!noMenstruation)}
          accessibilityLabel="Je n'ai pas de menstruation"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: noMenstruation }}
        >
          <View style={[s.checkMark, noMenstruation && s.checkMarkActive]}>
            {noMenstruation && <Text style={s.checkIcon}>✓</Text>}
          </View>
          <Text style={[s.checkLabel, noMenstruation && s.checkLabelActive]}>
            Je n'ai pas de menstruation
          </Text>
        </TouchableOpacity>

        {!noMenstruation && (
          <>
            {/* Last period date */}
            <View style={s.section}>
              <Text style={s.fieldLabel}>Date de tes dernières règles</Text>
              <TouchableOpacity
                style={s.datePill}
                onPress={openDatePicker}
                accessibilityLabel="Sélectionner la date des dernières règles"
                accessibilityRole="button"
              >
                <Text style={[s.datePillText, !lastDate && s.datePillPlaceholder]}>
                  {lastDate ? formatDate(lastDate) : 'Touche pour choisir'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Cycle duration */}
            <View style={s.section}>
              <Text style={s.fieldLabel}>Durée de ton cycle</Text>
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
          themeVariant={isDark ? 'dark' : 'light'}
          style={s.datePicker}
        />
        <TouchableOpacity
          style={s.confirmBtn}
          onPress={confirmDate}
          accessibilityLabel="Valider la date"
          accessibilityRole="button"
        >
          <Text style={s.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
    </OnboardingShell>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { gap: Spacing.lg },

    checkbox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: C.hairline,
      padding: Spacing.base,
      ...Shadow.sm,
    },
    checkboxActive: {
      backgroundColor: C.primaryTint,
      borderColor: C.primary,
    },
    checkMark: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: C.hairline,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMarkActive: {
      backgroundColor: C.primary,
      borderColor: C.primary,
    },
    checkIcon:  { fontSize: 13, color: '#fff', fontWeight: '700' },
    checkLabel: { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: C.ink2 },
    checkLabelActive: { color: C.primaryStrong },

    section: { gap: Spacing.sm },
    fieldLabel: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: C.ink3,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },

    datePill: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: C.hairline,
      paddingHorizontal: Spacing.base,
      paddingVertical: 14,
      ...Shadow.sm,
    },
    datePillText:        { fontSize: FontSize.base, fontWeight: '500', color: C.ink },
    datePillPlaceholder: { color: C.ink3 },

    datePicker: { width: '100%' as any },

    confirmBtn: {
      marginTop: Spacing.md,
      backgroundColor: C.primary,
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
}
