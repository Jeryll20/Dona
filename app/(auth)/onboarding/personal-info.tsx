import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
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

export default function PersonalInfo() {
  const setProfile = useUserStore((s) => s.setProfile);
  const stored     = useUserStore((s) => s.profile);

  const [firstName, setFirstName] = useState(stored.firstName ?? '');
  const [lastName,  setLastName]  = useState(stored.lastName  ?? '');
  const [dob, setDob] = useState<Date | null>(
    stored.dateOfBirth ? new Date(stored.dateOfBirth) : null,
  );
  const [showPicker, setShowPicker] = useState(false);

  const canContinue = firstName.trim().length > 0;

  function handleNext() {
    setProfile({
      firstName: firstName.trim(),
      lastName:  lastName.trim() || undefined,
      dateOfBirth: dob ? dateToISO(dob) : undefined,
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
      <View style={styles.fields}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Marie"
              placeholderTextColor={Colors.light.ink3}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Prénom"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Dupont"
              placeholderTextColor={Colors.light.ink3}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Nom de famille"
            />
          </View>
        </View>

        <View>
          <Text style={styles.label}>Date de naissance</Text>
          <TouchableOpacity
            style={styles.datePill}
            onPress={() => setShowPicker(!showPicker)}
            accessibilityLabel="Sélectionner la date de naissance"
            accessibilityRole="button"
          >
            <Text style={[styles.datePillText, !dob && styles.datePillPlaceholder]}>
              {dob ? formatDate(dob) : 'Optionnel — touche pour choisir'}
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={dob ?? new Date(1995, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={new Date(1920, 0, 1)}
                onChange={(_, date) => {
                  if (date) setDob(date);
                  if (Platform.OS === 'android') setShowPicker(false);
                }}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => setShowPicker(false)}
                  accessibilityLabel="Confirmer la date"
                  accessibilityRole="button"
                >
                  <Text style={styles.confirmText}>Confirmer</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.lg },

  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  label: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },

  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
    ...Shadow.sm,
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
  datePillText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
  },
  datePillPlaceholder: { color: Colors.light.ink3 },

  pickerWrap: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  confirmBtn: {
    padding: Spacing.base,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.light.hairline,
  },
  confirmText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.light.primary,
  },
});
