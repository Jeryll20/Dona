import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/ui/Logo';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function LoginScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) setError(err.message);
    // On success, onAuthStateChange in _layout.tsx handles navigation
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

          <Text style={s.title}>Bon retour 👋</Text>
          <Text style={s.sub}>Connecte-toi pour retrouver ton planning.</Text>

          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>Adresse e-mail</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="toi@email.com"
                placeholderTextColor={C.ink3}
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
                placeholder="••••••••"
                placeholderTextColor={C.ink3}
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                accessibilityLabel="Mot de passe"
              />
            </View>

            {error !== '' && (
              <View style={s.errorWrap}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.btn, loading && s.btnOff]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Se connecter"
            >
              {loading
                ? <ActivityIndicator color={C.onPrimary} />
                : <Text style={s.btnText}>Se connecter</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Pas encore de compte ?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register' as any)}
              accessibilityRole="button"
              accessibilityLabel="Créer un compte"
            >
              <Text style={s.footerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:  { flex: 1, backgroundColor: C.background },
    inner: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.xl },

    logoWrap: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
    appName:  { fontSize: 22, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },

    title: { fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.5, marginBottom: Spacing.sm },
    sub:   { fontSize: FontSize.base, color: C.ink3, marginBottom: Spacing.xl, lineHeight: 22 },

    form:  { gap: Spacing.md },
    field: { gap: Spacing.xs },
    label: { fontSize: FontSize.sm, fontWeight: '700', color: C.ink2 },
    input: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.base,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
      ...Shadow.sm,
    },

    errorWrap: {
      backgroundColor: '#FEE2E2',
      borderRadius: Radius.input,
      padding: Spacing.md,
    },
    errorText: { fontSize: FontSize.sm, color: '#DC2626', fontWeight: '600' },

    btn: {
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.base,
      alignItems: 'center',
      marginTop: Spacing.sm,
      ...Shadow.sm,
    },
    btnOff:  { opacity: 0.6 },
    btnText: { fontSize: FontSize.base, fontWeight: '700', color: C.onPrimary },

    footer:     { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.xl },
    footerText: { fontSize: FontSize.base, color: C.ink3 },
    footerLink: { fontSize: FontSize.base, fontWeight: '700', color: C.primary },
  });
}
