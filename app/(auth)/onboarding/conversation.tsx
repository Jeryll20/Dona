import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Logo } from '@/components/ui/Logo';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

const SPORT_OPTIONS  = ['Le matin', 'Le midi', 'Le soir', 'Le week-end'];
const WORK_OPTIONS   = ['En présentiel', 'En télétravail', 'Hybride', 'Je ne travaille pas'];

export default function ConversationScreen() {
  const { sport, work, setSport, setWork } = useUserStore();
  const [sportTime,  setSportTime]  = useState<string | null>(null);
  const [workMode,   setWorkMode]   = useState<string | null>(null);

  const canContinue = sportTime !== null && workMode !== null;

  function handleNext() {
    setSport({ schedule: sportTime ?? undefined });
    setWork({ schedule: workMode ?? undefined });
    router.push('/(auth)/onboarding/recap');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Logo size={36} />
          <Text style={styles.dona}>Dona</Text>
        </View>

        {/* Q1: Sport timing */}
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            {sport.active
              ? 'Super ! Plutôt à quelle heure tu fais du sport ?'
              : 'Si tu devais faire une activité, ce serait plutôt quand ?'}
          </Text>
        </View>
        <View style={styles.options}>
          {SPORT_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.chip, sportTime === o && styles.chipActive]}
              onPress={() => setSportTime(o)}
              accessibilityLabel={o}
              accessibilityRole="radio"
              accessibilityState={{ selected: sportTime === o }}
            >
              <Text style={[styles.chipText, sportTime === o && styles.chipTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Q2: Work mode */}
        <View style={[styles.bubble, styles.bubbleDelay]}>
          <Text style={styles.bubbleText}>Et pour ton travail ou tes études ?</Text>
        </View>
        <View style={styles.options}>
          {WORK_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.chip, workMode === o && styles.chipActive]}
              onPress={() => setWorkMode(o)}
              accessibilityLabel={o}
              accessibilityRole="radio"
              accessibilityState={{ selected: workMode === o }}
            >
              <Text style={[styles.chipText, workMode === o && styles.chipTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton onPress={handleNext} disabled={!canContinue}>
          Voir mon planning
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.light.background },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100, paddingTop: Spacing.xl, gap: Spacing.lg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dona: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink, letterSpacing: -0.3 },

  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    borderBottomLeftRadius: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  bubbleDelay: { marginTop: Spacing.md },
  bubbleText:  { fontSize: FontSize.base, color: Colors.light.ink, lineHeight: 22, fontWeight: '500' },

  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    ...Shadow.sm,
  },
  chipActive:    { backgroundColor: Colors.light.primaryTint, borderColor: Colors.light.primary },
  chipText:      { fontSize: FontSize.sm, fontWeight: '600', color: Colors.light.ink2 },
  chipTextActive: { color: Colors.light.primaryStrong },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
});
