import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DayPicker } from '@/components/onboarding/DayPicker';
import { Sheet } from '@/components/ui/Sheet';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { WeekDay } from '@/types';

export default function OtherScreen() {
  const setOtherActivity = useUserStore((s) => s.setOtherActivity);
  const stored           = useUserStore((s) => s.otherActivity);

  const [active,    setActive]    = useState(stored.active    ?? false);
  const [title,     setTitle]     = useState(stored.title     ?? '');
  const [days,      setDays]      = useState<WeekDay[]>(stored.days ?? []);
  const [startTime, setStartTime] = useState(stored.startTime ?? '18:00');
  const [endTime,   setEndTime]   = useState(stored.endTime   ?? '19:00');
  const [picker,    setPicker]    = useState<'start' | 'end' | null>(null);
  const [tempTime,  setTempTime]  = useState('');

  function openPicker(target: 'start' | 'end') {
    setTempTime(target === 'start' ? startTime : endTime);
    setPicker(target);
  }

  function confirmTime() {
    if (picker === 'start') setStartTime(tempTime);
    else if (picker === 'end') setEndTime(tempTime);
    setPicker(null);
  }

  function handleSave() {
    setOtherActivity({
      active,
      interested: false,
      title:     active ? title     : undefined,
      days:      active ? days      : undefined,
      startTime: active ? startTime : undefined,
      endTime:   active ? endTime   : undefined,
    });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Autre activité</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>J'ai une activité régulière</Text>
            <Text style={styles.toggleSub}>Cours, bénévolat, apprentissage, culture…</Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: Colors.light.hairline, true: Colors.light.primary }}
            thumbColor={Colors.light.surface}
            accessibilityLabel="Activer l'activité"
          />
        </View>

        {active && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Activité</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex : Cours de piano, Bénévolat, Dessin…"
                placeholderTextColor={Colors.light.ink3}
                returnKeyType="done"
                accessibilityLabel="Nom de l'activité"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Jours</Text>
              <DayPicker value={days} onChange={setDays} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Horaires</Text>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => openPicker('start')}
                  accessibilityLabel="Heure de début"
                >
                  <Text style={styles.timeBtnLabel}>Début</Text>
                  <Text style={styles.timeBtnValue}>{startTime}</Text>
                </TouchableOpacity>
                <Text style={styles.timeSep}>→</Text>
                <TouchableOpacity
                  style={styles.timeBtn}
                  onPress={() => openPicker('end')}
                  accessibilityLabel="Heure de fin"
                >
                  <Text style={styles.timeBtnLabel}>Fin</Text>
                  <Text style={styles.timeBtnValue}>{endTime}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
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

      <Sheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'start' ? 'Heure de début' : 'Heure de fin'}
      >
        <TimeField value={tempTime} onChange={setTempTime} />
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={confirmTime}
          accessibilityLabel="Valider"
          accessibilityRole="button"
        >
          <Text style={styles.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
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

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.block,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  toggleLabel: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink },
  toggleSub:   { fontSize: FontSize.sm, color: Colors.light.ink3, marginTop: 2 },

  section:      { gap: Spacing.sm },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.light.ink3,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },

  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.light.ink,
    ...Shadow.sm,
  },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timeBtn: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    paddingVertical: 14,
    paddingHorizontal: Spacing.base,
    gap: 4,
    ...Shadow.sm,
  },
  timeBtnLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.light.ink3, textTransform: 'uppercase', letterSpacing: 0.4 },
  timeBtnValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.light.ink, letterSpacing: -0.3 },
  timeSep:      { fontSize: FontSize.base, color: Colors.light.ink3, fontWeight: '600' },

  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },

  confirmBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.base + 2,
    alignItems: 'center',
  },
  confirmText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
