import { StyleSheet, View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

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
  children: React.ReactNode;
}

export default function OnboardingShell({
  step,
  total = 6,
  eyebrow,
  eyebrowIcon,
  question,
  sub,
  footer,
  onNext,
  onBack,
  nextLabel = 'Continuer',
  nextDisabled,
  children,
}: OnboardingShellProps) {
  const progress = step / total;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack ?? (() => router.back())}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.light.ink2} />
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
          </View>
          <Text style={styles.stepCount}>{step}/{total}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Eyebrow pill */}
          <View style={styles.eyebrow}>
            <Ionicons name={eyebrowIcon} size={15} color={Colors.light.primaryStrong} />
            <Text style={styles.eyebrowText}>{eyebrow}</Text>
          </View>

          <Text style={styles.question}>{question}</Text>
          {sub && <Text style={styles.sub}>{sub}</Text>}

          <View style={[styles.body, !sub && { marginTop: Spacing.xl }]}>{children}</View>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {footer && <Text style={styles.footerText}>{footer}</Text>}
          <TouchableOpacity
            style={[styles.nextBtn, nextDisabled && styles.nextBtnDisabled]}
            onPress={onNext}
            disabled={nextDisabled}
            accessibilityLabel={nextLabel}
            accessibilityRole="button"
          >
            <Text style={[styles.nextText, nextDisabled && styles.nextTextDisabled]}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
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
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...Shadow.sm,
  },
  progressTrack: {
    flex: 1,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primary,
  },
  stepCount: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.ink3,
    minWidth: 28,
    textAlign: 'right',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  eyebrowText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.primaryStrong,
    letterSpacing: 0.2,
  },
  question: {
    fontSize: 29,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.6,
    lineHeight: 34,
    maxWidth: 320,
  },
  sub: {
    fontSize: FontSize.md,
    lineHeight: 23,
    color: Colors.light.ink3,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    maxWidth: 300,
  },
  body: { marginTop: Spacing.xl },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.base,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base + 2,
    width: '100%',
    ...Shadow.md,
  },
  nextBtnDisabled: {
    backgroundColor: Colors.light.surfaceSunk,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.1,
  },
  nextTextDisabled: { color: Colors.light.ink3 },
});
