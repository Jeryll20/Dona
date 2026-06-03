import {
  StyleSheet, View, Text, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { Sheet } from '@/components/ui/Sheet';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { MealEntry } from '@/types';

const DEFAULT_LABELS = [
  'Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation', 'Souper',
];

export default function Q4Meals() {
  const setMeals = useUserStore((s) => s.setMeals);
  const stored   = useUserStore((s) => s.meals);

  const [entries, setEntries] = useState<MealEntry[]>(
    stored.entries ?? [
      { time: '08:00', label: 'Petit-déjeuner' },
      { time: '13:00', label: 'Déjeuner' },
      { time: '19:30', label: 'Dîner' },
    ],
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState('');

  function openEditor(i: number) {
    setTempTime(entries[i].time);
    setEditingIndex(i);
  }

  function confirmEdit() {
    if (editingIndex !== null) updateTime(editingIndex, tempTime);
    setEditingIndex(null);
  }

  function updateTime(i: number, time: string) {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, time } : e));
  }

  function addMeal() {
    if (entries.length >= 5) return;
    const label = DEFAULT_LABELS[entries.length] ?? `Repas ${entries.length + 1}`;
    setEntries((prev) => [...prev, { time: '12:00', label }]);
  }

  function removeMeal(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
    if (editingIndex === i) setEditingIndex(null);
  }

  function handleNext() {
    setMeals({ entries });
    router.push('/(auth)/onboarding/q5-sport');
  }

  return (
    <OnboardingShell
      step={4}
      eyebrow="Repas"
      eyebrowIcon="restaurant-outline"
      question="Quels sont tes horaires de repas ?"
      sub="Touche l'heure pour la modifier. Maximum 5 repas."
      onBack={() => router.push('/(auth)/onboarding/q3-morning-prep')}
      onNext={handleNext}
      scrollable
    >
      <View style={styles.list}>
        {entries.map((entry, i) => (
          <View key={i} style={styles.mealRow}>
            <View style={styles.mealLeft}>
              <Text style={styles.mealLabel}>{entry.label}</Text>
              <TouchableOpacity
                style={[styles.timePill, editingIndex === i && styles.timePillActive]}
                onPress={() => openEditor(i)}
                accessibilityLabel={`Modifier l'heure de ${entry.label}`}
                accessibilityRole="button"
              >
                <Text style={styles.timePillText}>{entry.time}</Text>
              </TouchableOpacity>
            </View>
            {entries.length > 1 && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeMeal(i)}
                accessibilityLabel={`Supprimer ${entry.label}`}
                accessibilityRole="button"
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {entries.length < 5 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={addMeal}
            accessibilityLabel="Ajouter un repas"
            accessibilityRole="button"
          >
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Ajouter un repas</Text>
          </TouchableOpacity>
        )}
      </View>

      <Sheet
        open={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        title={editingIndex !== null ? entries[editingIndex]?.label : undefined}
      >
        <TimeField value={tempTime} onChange={setTempTime} />
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={confirmEdit}
          accessibilityLabel="Valider l'heure"
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm },

  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  mealLeft: { flex: 1, gap: 6 },
  mealLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  timePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.base,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timePillActive: { borderColor: Colors.light.primary },
  timePillText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.primaryStrong,
    letterSpacing: -0.3,
  },

  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 12, color: Colors.light.ink3, fontWeight: '600' },

  confirmBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.primary,
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

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryTint,
    marginTop: Spacing.xs,
  },
  addBtnIcon: { fontSize: 20, fontWeight: '700', color: Colors.light.primary },
  addBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.primaryStrong },
});
