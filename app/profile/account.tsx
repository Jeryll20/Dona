import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUserStore } from '@/store/useUserStore';
import { useAuthStore } from '@/store/useAuthStore';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { ActivityLocation } from '@/types';

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d); // local time — avoids UTC timezone shift
}

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AccountScreen() {
  const { profile, setProfile } = useUserStore();
  const email = useAuthStore((s) => s.session?.user?.email ?? '');

  const [firstName,   setFirstName]   = useState(profile.firstName   ?? '');
  const [lastName,    setLastName]    = useState(profile.lastName     ?? '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    profile.dateOfBirth ? parseLocalDate(profile.dateOfBirth) : null,
  );
  const [showPicker,  setShowPicker]  = useState(false);
  const [homeLocation, setHomeLocation] = useState<ActivityLocation | undefined>(
    profile.homeLocation,
  );
  const [keyboardH, setKeyboardH] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardH(e.endCoordinates.height);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardH(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const storedGender = profile.gender;
  const [genderKey,   setGenderKey]   = useState<'homme' | 'femme' | 'autre' | null>(
    storedGender === 'homme' ? 'homme'
    : storedGender === 'femme' ? 'femme'
    : storedGender ? 'autre'
    : null,
  );
  const [genderOther, setGenderOther] = useState(
    storedGender && storedGender !== 'homme' && storedGender !== 'femme' ? storedGender : '',
  );

  function handleSave() {
    const gender =
      genderKey === 'homme' ? 'homme'
      : genderKey === 'femme' ? 'femme'
      : genderKey === 'autre' ? (genderOther.trim() || 'autre')
      : undefined;

    setProfile({
      firstName:    firstName.trim(),
      lastName:     lastName.trim() || undefined,
      dateOfBirth:  dateOfBirth ? toLocalISODate(dateOfBirth) : undefined,
      gender,
      homeLocation: homeLocation ?? undefined,
    });
    router.back();
  }

  const avatarLetter = (firstName.trim() || profile.firstName || 'D')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Mon compte</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: keyboardH > 0 ? keyboardH + 40 : 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar preview */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Identité</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ton prénom"
              placeholderTextColor={Colors.light.ink3}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Prénom"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nom de famille</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ton nom (optionnel)"
              placeholderTextColor={Colors.light.ink3}
              autoCapitalize="words"
              returnKeyType="done"
              accessibilityLabel="Nom de famille"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sexe</Text>
          <View style={styles.genderRow}>
            {(['homme', 'femme', 'autre'] as const).map((key) => {
              const labels = { homme: 'Homme', femme: 'Femme', autre: 'Autre' };
              const on = genderKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.genderPill, on && styles.genderPillOn]}
                  onPress={() => setGenderKey(key)}
                  accessibilityLabel={labels[key]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.genderText, on && styles.genderTextOn]}>{labels[key]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {genderKey === 'autre' && (
            <TextInput
              style={styles.input}
              value={genderOther}
              onChangeText={setGenderOther}
              placeholder="Précise si tu le souhaites…"
              placeholderTextColor={Colors.light.ink3}
              returnKeyType="done"
              accessibilityLabel="Préciser le genre"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date de naissance</Text>
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() => setShowPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Choisir la date de naissance"
          >
            <Ionicons name="calendar-outline" size={18} color={Colors.light.primary} />
            <Text style={[styles.dateText, !dateOfBirth && styles.datePlaceholder]}>
              {dateOfBirth ? formatDate(dateOfBirth.toISOString().split('T')[0]) : 'Non renseignée'}
            </Text>
            {dateOfBirth && (
              <TouchableOpacity
                onPress={() => setDateOfBirth(null)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                accessibilityLabel="Effacer la date"
              >
                <Ionicons name="close-circle" size={18} color={Colors.light.ink3} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={dateOfBirth ?? new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowPicker(Platform.OS === 'ios');
                if (date) setDateOfBirth(date);
              }}
              themeVariant="light"
              accentColor={Colors.light.primary}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Domicile</Text>
          <Text style={styles.hint}>
            Utilisée pour calculer les temps de trajet vers tes activités.
          </Text>
          <LocationPicker value={homeLocation} onChange={setHomeLocation} placeholder="Adresse de ton domicile…" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Compte</Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={18} color={Colors.light.ink3} />
            <Text style={styles.emailText}>{email}</Text>
            <View style={styles.readonlyBadge}>
              <Text style={styles.readonlyText}>lecture seule</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer"
        >
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.light.background },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.input,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.xl },

  avatarWrap: { alignItems: 'center', paddingTop: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.light.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  avatarLetter: { fontSize: 36, fontWeight: '800', color: Colors.light.onPrimary },

  section:      { gap: Spacing.md },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  hint: { fontSize: FontSize.sm, fontWeight: '400', color: Colors.light.ink3, lineHeight: 19 },

  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.light.ink2 },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
    ...Shadow.sm,
  },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    ...Shadow.sm,
  },
  dateText:        { flex: 1, fontSize: FontSize.base, fontWeight: '500', color: Colors.light.ink },
  datePlaceholder: { color: Colors.light.ink3 },

  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    ...Shadow.sm,
  },
  emailText: { flex: 1, fontSize: FontSize.base, fontWeight: '500', color: Colors.light.ink2 },
  readonlyBadge: {
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  readonlyText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.light.ink3 },

  genderRow:    { flexDirection: 'row', gap: Spacing.sm },
  genderPill: {
    flex: 1, paddingVertical: Spacing.base,
    backgroundColor: Colors.light.surface, borderRadius: Radius.input,
    borderWidth: 1.5, borderColor: Colors.light.hairline,
    alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  genderPillOn:  { backgroundColor: Colors.light.primaryTint, borderColor: Colors.light.primary },
  genderText:    { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink2 },
  genderTextOn:  { color: Colors.light.primaryStrong, fontWeight: '700' },

  saveBtn: {
    backgroundColor: Colors.light.primary, borderRadius: Radius.pill,
    paddingVertical: Spacing.base, alignItems: 'center', ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
