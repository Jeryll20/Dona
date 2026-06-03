import {
  StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView,
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

export default function WorkScreen() {
  const setWork = useUserStore((s) => s.setWork);
  const stored  = useUserStore((s) => s.work);

  const [role,      setRole]      = useState(stored.role      ?? '');
  const [days,      setDays]      = useState<WeekDay[]>(stored.days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [startTime, setStartTime] = useState(stored.startTime ?? '09:00');
  const [endTime,   setEndTime]   = useState(stored.endTime   ?? '17:00');
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
    setWork({ employed: true, role, days, startTime, endTime });
    router.back();
  }

  function handleDelete() {
    setWork({ employed: false, role: undefined, days: undefined, startTime: undefined, endTime: undefined });
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Emploi</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} accessibilityLabel="Supprimer">
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Intitulé</Text>
          <TextInput
            style={styles.input}
            value={role}
            onChangeText={setRole}
            placeholder="Ex : Développeur, Infirmière, Étudiant…"
            placeholderTextColor={Colors.light.ink3}
            returnKeyType="done"
            accessibilityLabel="Intitulé du poste"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Jours</Text>
          <DayPicker value={days} onChange={setDays} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Horaires</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('start')} accessibilityLabel="Heure de début">
              <Text style={styles.timeBtnLabel}>Début</Text>
              <Text style={styles.timeBtnValue}>{startTime}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSep}>→</Text>
            <TouchableOpacity style={styles.timeBtn} onPress={() => openPicker('end')} accessibilityLabel="Heure de fin">
              <Text style={styles.timeBtnLabel}>Fin</Text>
              <Text style={styles.timeBtnValue}>{endTime}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Enregistrer">
          <Text style={styles.saveBtnText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>

      <Sheet open={picker !== null} onClose={() => setPicker(null)} title={picker === 'start' ? 'Heure de début' : 'Heure de fin'}>
        <TimeField value={tempTime} onChange={setTempTime} />
        <TouchableOpacity style={styles.confirmBtn} onPress={confirmTime} accessibilityLabel="Valider" accessibilityRole="button">
          <Text style={styles.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.input,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: Radius.input,
    backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.light.ink, letterSpacing: -0.3 },

  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 120, gap: Spacing.xl },

  section:      { gap: Spacing.sm },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.light.ink3, textTransform: 'uppercase', letterSpacing: 0.6 },

  input: {
    backgroundColor: Colors.light.surface, borderRadius: Radius.input,
    borderWidth: 1.5, borderColor: Colors.light.hairline,
    paddingHorizontal: Spacing.base, paddingVertical: 14,
    fontSize: FontSize.base, fontWeight: '500', color: Colors.light.ink, ...Shadow.sm,
  },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  timeBtn: {
    flex: 1, backgroundColor: Colors.light.surface, borderRadius: Radius.input,
    borderWidth: 1.5, borderColor: Colors.light.hairline,
    paddingVertical: 14, paddingHorizontal: Spacing.base, gap: 4, ...Shadow.sm,
  },
  timeBtnLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.light.ink3, textTransform: 'uppercase', letterSpacing: 0.4 },
  timeBtnValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.light.ink, letterSpacing: -0.3 },
  timeSep:      { fontSize: FontSize.base, color: Colors.light.ink3, fontWeight: '600' },

  saveBtn: {
    backgroundColor: Colors.light.primary, borderRadius: Radius.pill,
    paddingVertical: Spacing.base, alignItems: 'center', ...Shadow.sm,
  },
  saveBtnText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.onPrimary },

  confirmBtn: {
    marginTop: Spacing.md, backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill, paddingVertical: Spacing.base + 2, alignItems: 'center',
  },
  confirmText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
});
