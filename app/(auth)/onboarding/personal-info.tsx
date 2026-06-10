import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { Sheet } from '@/components/ui/Sheet';
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

export default function PersonalInfo() {
  const C = useColors();
  const isDark = useIsDark();
  const s = makeStyles(C);
  const setProfile = useUserStore((st) => st.setProfile);
  const stored     = useUserStore((st) => st.profile);

  const [firstName, setFirstName] = useState(stored.firstName ?? '');
  const [lastName,  setLastName]  = useState(stored.lastName  ?? '');
  const [dob, setDob] = useState<Date | null>(
    stored.dateOfBirth ? new Date(stored.dateOfBirth) : null,
  );
  const [showPicker, setShowPicker] = useState(false);
  const [tempDob, setTempDob] = useState<Date>(new Date(1995, 0, 1));

  const storedGender = stored.gender;
  const [genderKey,   setGenderKey]   = useState<'homme' | 'femme' | 'autre' | null>(
    storedGender === 'homme' ? 'homme'
    : storedGender === 'femme' ? 'femme'
    : storedGender ? 'autre'
    : null,
  );
  const [genderOther, setGenderOther] = useState(
    storedGender && storedGender !== 'homme' && storedGender !== 'femme' ? storedGender : '',
  );

  const canContinue = firstName.trim().length > 0;

  function openDatePicker() {
    setTempDob(dob ?? new Date(1995, 0, 1));
    setShowPicker(true);
  }

  function confirmDate() {
    setDob(tempDob);
    setShowPicker(false);
  }

  function handleNext() {
    const gender =
      genderKey === 'homme' ? 'homme'
      : genderKey === 'femme' ? 'femme'
      : genderKey === 'autre' ? (genderOther.trim() || 'autre')
      : undefined;

    setProfile({
      firstName:   firstName.trim(),
      lastName:    lastName.trim() || undefined,
      dateOfBirth: dob ? dateToISO(dob) : undefined,
      gender,
    });
    router.push('/(auth)/onboarding/q1-bedtime');
  }

  return (
    <OnboardingShell
      step={1}
      eyebrow="Infos personnelles"
      eyebrowIcon="person-outline"
      question="Comment tu t'appelles ?"
      sub="Ces informations restent privées et ne sont jamais partagées."
      onBack={() => router.push('/(auth)/welcome')}
      onNext={handleNext}
      nextDisabled={!canContinue}
      scrollable
    >
      <View style={s.fields}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Prénom *</Text>
            <TextInput
              style={s.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Marie"
              placeholderTextColor={C.ink3}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Prénom"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Nom</Text>
            <TextInput
              style={s.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Dupont"
              placeholderTextColor={C.ink3}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Nom de famille"
            />
          </View>
        </View>

        <View>
          <Text style={s.label}>Sexe</Text>
          <View style={s.genderRow}>
            {(['homme', 'femme', 'autre'] as const).map((key) => {
              const labels = { homme: 'Homme', femme: 'Femme', autre: 'Autre' };
              const on = genderKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.genderPill, on && s.genderPillOn]}
                  onPress={() => setGenderKey(key)}
                  accessibilityLabel={labels[key]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[s.genderText, on && s.genderTextOn]}>{labels[key]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {genderKey === 'autre' && (
            <TextInput
              style={[s.input, { marginTop: Spacing.sm }]}
              value={genderOther}
              onChangeText={setGenderOther}
              placeholder="Précise si tu le souhaites…"
              placeholderTextColor={C.ink3}
              returnKeyType="done"
              accessibilityLabel="Préciser le genre"
            />
          )}
        </View>

        <View>
          <Text style={s.label}>Date de naissance</Text>
          <TouchableOpacity
            style={s.datePill}
            onPress={openDatePicker}
            accessibilityLabel="Sélectionner la date de naissance"
            accessibilityRole="button"
          >
            <Text style={[s.datePillText, !dob && s.datePillPlaceholder]}>
              {dob ? formatDate(dob) : 'Optionnel — touche pour choisir'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Sheet
        open={showPicker}
        onClose={() => setShowPicker(false)}
        title="Date de naissance"
      >
        <DateTimePicker
          value={tempDob}
          mode="date"
          display="spinner"
          maximumDate={new Date()}
          minimumDate={new Date(1920, 0, 1)}
          onChange={(_, date) => { if (date) setTempDob(date); }}
          themeVariant={isDark ? 'dark' : 'light'}
          style={s.datePicker}
        />
        <TouchableOpacity
          style={s.confirmBtn}
          onPress={confirmDate}
          accessibilityLabel="Confirmer la date"
          accessibilityRole="button"
        >
          <Text style={s.confirmText}>Confirmer</Text>
        </TouchableOpacity>
      </Sheet>
    </OnboardingShell>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    fields: { gap: Spacing.lg },

    row: {
      flexDirection: 'row',
      gap: Spacing.md,
    },

    label: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: C.ink3,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 6,
    },

    input: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: C.hairline,
      paddingHorizontal: Spacing.base,
      paddingVertical: 14,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
      ...Shadow.sm,
    },

    genderRow: { flexDirection: 'row', gap: Spacing.sm },
    genderPill: {
      flex: 1, paddingVertical: 13, borderRadius: Radius.input,
      backgroundColor: C.surface,
      borderWidth: 1.5, borderColor: C.hairline,
      alignItems: 'center', justifyContent: 'center',
      ...Shadow.sm,
    },
    genderPillOn: { backgroundColor: C.primaryTint, borderColor: C.primary },
    genderText:   { fontSize: FontSize.base, fontWeight: '600', color: C.ink2 },
    genderTextOn: { color: C.primaryStrong, fontWeight: '700' },

    datePill: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: C.hairline,
      paddingHorizontal: Spacing.base,
      paddingVertical: 14,
      ...Shadow.sm,
    },
    datePillText: {
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
    },
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
