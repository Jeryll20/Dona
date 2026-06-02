import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

function nextDefaultTime(existing: string[]): string {
  const defaults = ['08:00', '12:30', '19:30', '10:00', '16:00'];
  for (const t of defaults) {
    if (!existing.includes(t)) return t;
  }
  return '12:00';
}

export default function MealsScreen() {
  const { meals, setMeals } = useUserStore();
  const [times, setTimes] = useState<string[]>(meals.times ?? ['08:00', '12:30', '19:30']);

  function updateTime(index: number, value: string) {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function addMeal() {
    setTimes((prev) => [...prev, nextDefaultTime(prev)]);
  }

  function removeMeal(index: number) {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    const sorted = [...times].sort();
    setMeals({ times: sorted });
    router.back();
  }

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
        <Text style={styles.title}>Repas</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Indique tes horaires habituels de repas. Ils seront affichés sur ta timeline quotidienne.
        </Text>

        {times.map((t, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.mealLabel}>
              {t < '11:00' ? 'Petit-déjeuner' : t < '15:00' ? 'Déjeuner' : 'Dîner / Collation'}
            </Text>
            <View style={styles.rowBody}>
              <View style={styles.fieldWrap}>
                <TimeField value={t} onChange={(v) => updateTime(i, v)} />
              </View>
              {times.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeMeal(i)}
                  accessibilityLabel="Supprimer ce repas"
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {times.length < 5 && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={addMeal}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un repas"
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.light.primary} />
            <Text style={styles.addBtnText}>Ajouter un repas</Text>
          </TouchableOpacity>
        )}

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
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.input,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.xl },

  hint: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },

  row: { gap: Spacing.sm },
  mealLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fieldWrap: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    paddingHorizontal: Spacing.base,
    ...Shadow.sm,
  },
  deleteBtn: {
    width: 42, height: 42,
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.input,
    alignItems: 'center', justifyContent: 'center',
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
  },
  addBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.primary },

  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },
});
