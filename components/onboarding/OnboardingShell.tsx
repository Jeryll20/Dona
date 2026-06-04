import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

// Screens shorter than this threshold get reduced spacing
const SMALL_SCREEN_H = 700;

interface OnboardingShellProps {
  step: number;
  total?: number;
  eyebrow: string;
  eyebrowIcon: React.ComponentProps<typeof Ionicons>['name'];
  question: string;
  sub?: string;
  footer?: string;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  // Activer le scroll uniquement si le contenu peut déborder (ex. liste d'options longue)
  scrollable?: boolean;
  children: React.ReactNode;
}

export default function OnboardingShell({
  step,
  total = 9,
  eyebrow,
  eyebrowIcon,
  question,
  sub,
  footer,
  onNext,
  onBack,
  nextLabel = 'Continuer',
  nextDisabled,
  scrollable = false,
  children,
}: OnboardingShellProps) {
  const C = useColors();
  const s = makeStyles(C);
  const { height: screenH } = useWindowDimensions();
  const isSmallScreen = screenH < SMALL_SCREEN_H;
  const bodySpacing   = isSmallScreen ? Spacing.base : Spacing['2xl'];
  const progress      = step / total;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={onBack ?? (() => router.back())}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={C.ink2} />
          </TouchableOpacity>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={s.stepCount}>{step}/{total}</Text>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          scrollEnabled={scrollable}
        >
          {/* Eyebrow pill */}
          <View style={s.eyebrow}>
            <Ionicons name={eyebrowIcon} size={15} color={C.primaryStrong} />
            <Text style={s.eyebrowText}>{eyebrow}</Text>
          </View>

          <Text style={s.question}>{question}</Text>
          {sub && <Text style={s.sub}>{sub}</Text>}

          <View style={[s.body, { marginTop: bodySpacing }]}>{children}</View>
        </ScrollView>

        {/* Footer — hors du ScrollView pour rester fixe en bas */}
        <View style={s.footer}>
          {footer && <Text style={s.footerText}>{footer}</Text>}
          <TouchableOpacity
            style={[s.nextBtn, nextDisabled && s.nextBtnDisabled]}
            onPress={onNext}
            disabled={nextDisabled}
            accessibilityLabel={nextLabel}
            accessibilityRole="button"
          >
            <Text style={[s.nextText, nextDisabled && s.nextTextDisabled]}>
              {nextLabel}
            </Text>
            {!nextDisabled && (
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    kav:  { flex: 1 },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.base,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: C.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...Shadow.sm,
    },
    progressTrack: {
      flex: 1,
      height: 7,
      borderRadius: Radius.pill,
      backgroundColor: C.surfaceSunk,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: Radius.pill,
      backgroundColor: C.primary,
    },
    stepCount: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: C.ink3,
      minWidth: 28,
      textAlign: 'right',
    },

    scroll:        { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.base,
    },

    eyebrow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm - 2,
      backgroundColor: C.primaryTint,
      borderRadius: Radius.pill,
      alignSelf: 'flex-start',
      marginBottom: Spacing.lg,
    },
    eyebrowText: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: C.primaryStrong,
      letterSpacing: 0.2,
    },
    question: {
      fontSize: 29,
      fontWeight: '700',
      color: C.ink,
      letterSpacing: -0.6,
      lineHeight: 34,
      maxWidth: 320,
    },
    sub: {
      fontSize: FontSize.md,
      lineHeight: 23,
      color: C.ink3,
      marginTop: Spacing.sm,
      maxWidth: 300,
    },
    body: { flex: 1 },

    footer: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
      paddingTop: Spacing.md,
      gap: Spacing.base,
      alignItems: 'center',
    },
    footerText: {
      fontSize: FontSize.sm,
      color: C.ink3,
      textAlign: 'center',
      maxWidth: 260,
      lineHeight: 18,
    },
    nextBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      backgroundColor: C.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.base + 2,
      width: '100%',
      ...Shadow.md,
    },
    nextBtnDisabled: {
      backgroundColor: C.surfaceSunk,
      shadowOpacity: 0,
      elevation: 0,
    },
    nextText: {
      fontSize: FontSize.base,
      fontWeight: '600',
      color: '#fff',
      letterSpacing: 0.1,
    },
    nextTextDisabled: { color: C.ink3 },
  });
}
