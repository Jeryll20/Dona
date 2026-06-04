import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { MealEntry } from '@/types';

type EntryState = MealEntry & { id: string };

let _idCounter = 0;
function newId() { return String(++_idCounter); }

const MEAL_LABELS = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Goûter', 'Dîner', 'Autre'];

function defaultLabel(time: string): string {
  const h = parseInt(time.split(':')[0], 10);
  if (h < 11) return 'Petit-déjeuner';
  if (h < 15) return 'Déjeuner';
  if (h < 17) return 'Collation';
  if (h < 19) return 'Goûter';
  return 'Dîner';
}

function nextDefaultTime(existing: EntryState[]): string {
  const defaults = ['08:00', '12:30', '16:00', '19:30', '10:00'];
  for (const t of defaults) {
    if (!existing.find((e) => e.time === t)) return t;
  }
  return '12:00';
}

interface MealRowProps {
  entry: EntryState;
  index: number;
  canDelete: boolean;
  onTimeChange: (id: string, v: string) => void;
  onLabelChange: (id: string, v: string) => void;
  onDelete: (id: string) => void;
}

function MealRow({ entry, index, canDelete, onTimeChange, onLabelChange, onDelete }: MealRowProps) {
  const C = useColors();
  const row = makeRowStyles(C);
  const isOther   = !MEAL_LABELS.slice(0, -1).includes(entry.label);
  const [custom, setCustom] = useState(isOther ? entry.label : '');
  const [showCustom, setShowCustom] = useState(isOther);

  function selectLabel(label: string) {
    if (label === 'Autre') {
      setShowCustom(true);
      onLabelChange(entry.id, custom || 'Mon repas');
    } else {
      setShowCustom(false);
      onLabelChange(entry.id, label);
    }
  }

  function handleCustomChange(v: string) {
    setCustom(v);
    onLabelChange(entry.id, v || 'Mon repas');
  }

  const selectedChip = showCustom ? 'Autre' : (MEAL_LABELS.includes(entry.label) ? entry.label : 'Autre');

  return (
    <View style={row.wrap}>
      <View style={row.header}>
        <Text style={row.index}>Repas {index + 1}</Text>
        {canDelete && (
          <TouchableOpacity
            style={row.deleteBtn}
            onPress={() => onDelete(entry.id)}
            accessibilityLabel="Supprimer ce repas"
            accessibilityRole="button"
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>

      {/* Label chips */}
      <View style={row.chips}>
        {MEAL_LABELS.map((label) => {
          const active = label === selectedChip;
          return (
            <TouchableOpacity
              key={label}
              style={[row.chip, active && row.chipActive]}
              onPress={() => selectLabel(label)}
              accessibilityRole="button"
              accessibilityLabel={label}
            >
              <Text style={[row.chipText, active && row.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showCustom && (
        <TextInput
          style={row.customInput}
          value={custom}
          onChangeText={handleCustomChange}
          placeholder="Nom personnalisé…"
          placeholderTextColor={C.ink3}
          returnKeyType="done"
          accessibilityLabel="Nom personnalisé du repas"
        />
      )}

      {/* Time picker */}
      <View style={row.timeCard}>
        <TimeField value={entry.time} onChange={(v) => onTimeChange(entry.id, v)} />
      </View>
    </View>
  );
}

function makeRowStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap:   {
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      padding: Spacing.base,
      gap: Spacing.md,
      ...Shadow.sm,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    index:  { fontSize: FontSize.sm, fontWeight: '700', color: C.ink2 },
    deleteBtn: {
      width: 32, height: 32, borderRadius: Radius.input,
      backgroundColor: '#FEE2E2',
      alignItems: 'center', justifyContent: 'center',
    },
    chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    chip:         {
      paddingHorizontal: Spacing.md, paddingVertical: 6,
      borderRadius: Radius.pill,
      backgroundColor: C.surfaceSunk,
      borderWidth: 1.5, borderColor: 'transparent',
    },
    chipActive:   { backgroundColor: C.primaryTint, borderColor: C.primary },
    chipText:     { fontSize: FontSize.sm, fontWeight: '600', color: C.ink3 },
    chipTextActive: { color: C.primaryStrong },
    customInput: {
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
    },
    timeCard: {
      backgroundColor: C.surfaceSunk,
      borderRadius: Radius.input,
      paddingHorizontal: Spacing.base,
    },
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MealsScreen() {
  const C = useColors();
  const s = makeStyles(C);
  const { meals, setMeals } = useUserStore();

  const [entries, setEntries] = useState<EntryState[]>(() => {
    const source: MealEntry[] = meals.entries?.length
      ? meals.entries
      : meals.times?.length
        ? meals.times.map((t) => ({ time: t, label: defaultLabel(t) }))
        : [
            { time: '08:00', label: 'Petit-déjeuner' },
            { time: '12:30', label: 'Déjeuner' },
            { time: '19:30', label: 'Dîner' },
          ];
    return source.map((e) => ({ ...e, id: newId() }));
  });

  function updateTime(id: string, value: string) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, time: value } : e));
  }

  function updateLabel(id: string, value: string) {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, label: value } : e));
  }

  function addMeal() {
    const time = nextDefaultTime(entries);
    setEntries((prev) => [...prev, { time, label: defaultLabel(time), id: newId() }]);
  }

  function removeMeal(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleSave() {
    const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));
    const clean: MealEntry[] = sorted.map(({ id: _id, ...rest }) => rest);
    setMeals({ entries: clean, times: clean.map((e) => e.time) });
    router.back();
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={20} color={C.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Repas</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {entries.map((entry, i) => (
          <MealRow
            key={entry.id}
            entry={entry}
            index={i}
            canDelete={entries.length > 1}
            onTimeChange={updateTime}
            onLabelChange={updateLabel}
            onDelete={removeMeal}
          />
        ))}

        {entries.length < 6 && (
          <TouchableOpacity
            style={s.addBtn}
            onPress={addMeal}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un repas"
          >
            <Ionicons name="add-circle-outline" size={18} color={C.primary} />
            <Text style={s.addBtnText}>Ajouter un repas</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer"
        >
          <Text style={s.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: C.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: Radius.input,
      backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    title:  { fontSize: FontSize.lg, fontWeight: '800', color: C.ink, letterSpacing: -0.3 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, paddingTop: Spacing.sm, gap: Spacing.lg },

    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, paddingVertical: Spacing.base,
      backgroundColor: C.primaryTint, borderRadius: Radius.pill,
    },
    addBtnText: { fontSize: FontSize.base, fontWeight: '700', color: C.primary },

    saveBtn: {
      backgroundColor: C.primary, borderRadius: Radius.pill,
      paddingVertical: Spacing.base, alignItems: 'center', ...Shadow.sm,
    },
    saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: C.onPrimary },
  });
}
