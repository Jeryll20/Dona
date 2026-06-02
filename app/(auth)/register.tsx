import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function RegisterScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleRegister() {
    setError('');

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

    router.replace({ pathname: '/(auth)/verify-email' as any, params: { email: email.trim() } });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.inner}>
          <View style={s.logoWrap}>
            <Logo size={56} />
            <Text style={s.appName}>Dona</Text>
          </View>

          <Text style={s.title}>Créer un compte</Text>
          <Text style={s.sub}>Rejoins Dona et reprends le contrôle de ton temps.</Text>

          <View style={s.form}>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.light.background },
  inner: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },

  logoWrap: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  appName:  { fontSize: 22, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.5 },

  title: { fontSize: 28, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.5, marginBottom: Spacing.sm },
  sub:   { fontSize: FontSize.base, color: Colors.light.ink3, marginBottom: Spacing.xl, lineHeight: 22 },

  form:  { gap: Spacing.md },
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

  errorWrap: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.input,
    padding: Spacing.md,
  },
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
