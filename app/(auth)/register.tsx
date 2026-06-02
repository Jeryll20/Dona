import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/useUserStore';
import { Logo } from '@/components/ui/Logo';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function RegisterScreen() {
  const setProfile = useUserStore((s) => s.setProfile);

  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [dob,         setDob]         = useState<Date | null>(null);
  const [showPicker,  setShowPicker]  = useState(false);
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);

  async function handleRegister() {
    setError('');

    if (!firstName.trim()) {
      setError('Le prénom est obligatoire.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: 'dona://auth/callback' },
    });
    setLoading(false);

    if (err) {
      if (err.message.toLowerCase().includes('rate limit')) {
        setError('Trop de tentatives. Attends quelques minutes avant de réessayer.');
      } else if (err.message.toLowerCase().includes('already registered') || err.message.toLowerCase().includes('user already')) {
        setError('Un compte existe déjà avec cet email.');
      } else {
        setError(err.message);
      }
      return;
    }

    // Save personal info to local store (will sync to Supabase via profileSync)
    setProfile({
      firstName: firstName.trim(),
      lastName:  lastName.trim() || undefined,
      dateOfBirth: dob ? dob.toISOString().split('T')[0] : undefined,
    });

    router.replace({ pathname: '/(auth)/verify-email' as any, params: { email: email.trim() } });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.inner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logoWrap}>
            <Logo size={56} />
            <Text style={s.appName}>Dona</Text>
          </View>

          <Text style={s.title}>Créer un compte</Text>
          <Text style={s.sub}>Rejoins Dona et reprends le contrôle de ton temps.</Text>

          <View style={s.form}>
            {/* ── Identité ── */}
            <Text style={s.sectionLabel}>Identité</Text>

            <View style={s.nameRow}>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Prénom *</Text>
                <TextInput
                  style={s.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ton prénom"
                  placeholderTextColor={Colors.light.ink3}
                  autoCapitalize="words"
                  returnKeyType="next"
                  accessibilityLabel="Prénom"
                />
              </View>
              <View style={[s.field, { flex: 1 }]}>
                <Text style={s.label}>Nom</Text>
                <TextInput
                  style={s.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nom (opt.)"
                  placeholderTextColor={Colors.light.ink3}
                  autoCapitalize="words"
                  returnKeyType="next"
                  accessibilityLabel="Nom de famille"
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Date de naissance</Text>
              <TouchableOpacity
                style={s.dateBtn}
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Choisir la date de naissance"
              >
                <Text style={[s.dateText, !dob && s.datePlaceholder]}>
                  {dob ? formatDate(dob) : 'JJ / MM / AAAA (optionnel)'}
                </Text>
                {dob && (
                  <TouchableOpacity
                    onPress={() => setDob(null)}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    accessibilityLabel="Effacer la date"
                  >
                    <Text style={s.clearDate}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={dob ?? new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, date) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (date) setDob(date);
                  }}
                  themeVariant="light"
                  accentColor={Colors.light.primary}
                />
              )}
            </View>

            {/* ── Identifiants ── */}
            <Text style={[s.sectionLabel, { marginTop: Spacing.sm }]}>Identifiants</Text>

            <View style={s.field}>
              <Text style={s.label}>Adresse e-mail</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="toi@email.com"
                placeholderTextColor={Colors.light.ink3}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                accessibilityLabel="Adresse e-mail"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Mot de passe</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="6 caractères minimum"
                placeholderTextColor={Colors.light.ink3}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
                accessibilityLabel="Mot de passe"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                placeholderTextColor={Colors.light.ink3}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                accessibilityLabel="Confirmer le mot de passe"
              />
            </View>

            {error !== '' && (
              <View style={s.errorWrap}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btn, loading && s.btnOff]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Créer mon compte"
            >
              {loading
                ? <ActivityIndicator color={Colors.light.onPrimary} />
                : <Text style={s.btnText}>Créer mon compte</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Déjà un compte ?</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Se connecter"
            >
              <Text style={s.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.light.background },
  inner: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },

  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  appName:  { fontSize: 22, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.5 },

  title: { fontSize: 28, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.5, marginBottom: Spacing.sm },
  sub:   { fontSize: FontSize.base, color: Colors.light.ink3, marginBottom: Spacing.xl, lineHeight: 22 },

  form:  { gap: Spacing.md },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  nameRow: { flexDirection: 'row', gap: Spacing.md },
  field:   { gap: Spacing.xs },
  label:   { fontSize: FontSize.sm, fontWeight: '700', color: Colors.light.ink2 },
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

  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    ...Shadow.sm,
  },
  dateText:        { flex: 1, fontSize: FontSize.base, fontWeight: '500', color: Colors.light.ink },
  datePlaceholder: { color: Colors.light.ink3 },
  clearDate:       { fontSize: FontSize.sm, color: Colors.light.ink3, paddingLeft: Spacing.sm },

  errorWrap: { backgroundColor: '#FEE2E2', borderRadius: Radius.input, padding: Spacing.md },
  errorText: { fontSize: FontSize.sm, color: '#DC2626', fontWeight: '600' },

  btn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadow.sm,
  },
  btnOff:  { opacity: 0.6 },
  btnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },

  footer:     { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.xl },
  footerText: { fontSize: FontSize.base, color: Colors.light.ink3 },
  footerLink: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.primary },
});
