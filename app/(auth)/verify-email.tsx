import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';
import { Logo } from '@/components/ui/Logo';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

export default function VerifyEmailScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { email } = useLocalSearchParams<{ email: string }>();
  const session   = useAuthStore((st) => st.session);
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);

  // Session set = email confirmed → _layout.tsx routing takes over
  useEffect(() => {
    if (session) router.replace('/(auth)/welcome');
  }, [session]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.inner}>
        <View style={s.logoWrap}>
          <Logo size={56} />
        </View>

        <View style={s.iconWrap}>
          <Text style={s.icon}>✉️</Text>
        </View>

        <Text style={s.title}>Vérifie ta boîte mail</Text>
        <Text style={s.sub}>
          Un lien de confirmation a été envoyé à{'\n'}
          <Text style={s.email}>{email ?? 'ton adresse e-mail'}</Text>
        </Text>

        <View style={s.hint}>
          <Text style={s.hintText}>
            Clique sur le lien dans l'e-mail pour activer ton compte. Cette page se mettra à jour automatiquement.
          </Text>
        </View>

        <View style={s.waiting}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={s.waitingText}>En attente de confirmation…</Text>
        </View>

        <TouchableOpacity
          style={[s.resendBtn, resending && s.resendOff]}
          onPress={handleResend}
          disabled={resending || resent}
          accessibilityRole="button"
          accessibilityLabel="Renvoyer l'email"
        >
          <Text style={s.resendText}>
            {resent ? '✓ Email renvoyé !' : 'Renvoyer l\'email'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login' as any)}
          accessibilityRole="button"
          accessibilityLabel="Retour à la connexion"
        >
          <Text style={s.back}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:  { flex: 1, backgroundColor: C.background },
    inner: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, alignItems: 'center' },

    logoWrap: { marginBottom: Spacing.xl },
    iconWrap: {
      width: 80, height: 80, borderRadius: 24,
      backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
      marginBottom: Spacing.lg,
      ...Shadow.sm,
    },
    icon: { fontSize: 36 },

    title: {
      fontSize: 26, fontWeight: '800', color: C.ink,
      letterSpacing: -0.5, marginBottom: Spacing.sm, textAlign: 'center',
    },
    sub: {
      fontSize: FontSize.base, color: C.ink3,
      textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg,
    },
    email: { fontWeight: '700', color: C.ink },

    hint: {
      backgroundColor: C.primaryTint,
      borderRadius: Radius.block,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
    },
    hintText: {
      fontSize: FontSize.sm, color: C.primaryStrong,
      textAlign: 'center', lineHeight: 20,
    },

    waiting: {
      flexDirection: 'row', alignItems: 'center',
      gap: Spacing.sm, marginBottom: Spacing.xl,
    },
    waitingText: { fontSize: FontSize.sm, color: C.ink3, fontWeight: '600' },

    resendBtn: {
      backgroundColor: C.surface,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
      ...Shadow.sm,
    },
    resendOff: { opacity: 0.5 },
    resendText: { fontSize: FontSize.base, fontWeight: '700', color: C.primary },

    back: { fontSize: FontSize.sm, color: C.ink3, fontWeight: '600' },
  });
}
