import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { ActivityBlock, type ActivityStatus } from '@/components/onboarding/ActivityBlock';
import { DayPicker } from '@/components/onboarding/DayPicker';
import { Sheet } from '@/components/ui/Sheet';
import { TimeField } from '@/components/ui/TimeField';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { WeekDay } from '@/types';

type OtherEntry = {
  id: string;
  title: string;
  days: WeekDay[];
  startTime: string;
  endTime: string;
};

// ── ExtraBlock — form for additional other activities ─────────────────────────

function ExtraBlock({ entry, index, onChange, onRemove }: {
  entry: OtherEntry;
  index: number;
  onChange: (patch: Partial<OtherEntry>) => void;
  onRemove: () => void;
}) {
  const C = useColors();
  const xb = makeXbStyles(C);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState('');

  function openPicker(target: 'start' | 'end') {
    setTempTime(target === 'start' ? entry.startTime : entry.endTime);
    setPickerTarget(target);
  }

  function confirmTime() {
    if (pickerTarget === 'start') onChange({ startTime: tempTime });
    else if (pickerTarget === 'end') onChange({ endTime: tempTime });
    setPickerTarget(null);
  }

  return (
    <View style={xb.container}>
      <View style={xb.header}>
        <Text style={xb.heading}>Activité {index + 2}</Text>
        <TouchableOpacity
          onPress={onRemove}
          style={xb.removeBtn}
          accessibilityLabel="Supprimer cette activité"
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close-circle" size={22} color={C.ink3} />
        </TouchableOpacity>
      </View>

      <Text style={xb.label}>Quoi ?</Text>
      <TextInput
        style={xb.input}
        value={entry.title}
        onChangeText={(t) => onChange({ title: t })}
        placeholder="Ex: Cours de piano, Bénévolat…"
        placeholderTextColor={C.ink3}
        returnKeyType="done"
        accessibilityLabel="Nom de l'activité"
      />

      <Text style={[xb.label, { marginTop: Spacing.md }]}>Quels jours ?</Text>
      <DayPicker value={entry.days} onChange={(d) => onChange({ days: d })} />

      <Text style={[xb.label, { marginTop: Spacing.md }]}>De quelle heure à quelle heure ?</Text>
      <View style={xb.timeRow}>
        <TouchableOpacity
          style={[xb.timeBtn, pickerTarget === 'start' && xb.timeBtnActive]}
          onPress={() => openPicker('start')}
          accessibilityLabel="Heure de début"
        >
          <Text style={xb.timeBtnText}>{entry.startTime}</Text>
        </TouchableOpacity>
        <Text style={xb.timeSep}>→</Text>
        <TouchableOpacity
          style={[xb.timeBtn, pickerTarget === 'end' && xb.timeBtnActive]}
          onPress={() => openPicker('end')}
          accessibilityLabel="Heure de fin"
        >
          <Text style={xb.timeBtnText}>{entry.endTime}</Text>
        </TouchableOpacity>
      </View>

      <Sheet
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget === 'start' ? 'Heure de début' : 'Heure de fin'}
      >
        <TimeField value={tempTime} onChange={setTempTime} />
        <TouchableOpacity style={xb.confirmBtn} onPress={confirmTime} accessibilityLabel="Valider">
          <Text style={xb.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
    </View>
  );
}

function makeXbStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      padding: Spacing.base,
      borderWidth: 1.5,
      borderColor: C.hairline,
      ...Shadow.sm,
    },
    header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    heading:   { fontSize: FontSize.base, fontWeight: '700', color: C.ink },
    removeBtn: { padding: 2 },
    label: {
      fontSize: FontSize.sm, fontWeight: '700', color: C.ink3,
      textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4,
    },
    input: {
      backgroundColor: C.surface, borderRadius: Radius.input,
      borderWidth: 1.5, borderColor: C.hairline,
      paddingHorizontal: Spacing.base, paddingVertical: 14,
      fontSize: FontSize.base, fontWeight: '500', color: C.ink,
    },
    timeRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    timeBtn: {
      flex: 1, backgroundColor: C.surface, borderRadius: Radius.input,
      borderWidth: 1.5, borderColor: C.hairline,
      paddingVertical: 14, alignItems: 'center', ...Shadow.sm,
    },
    timeBtnActive:{ borderColor: C.primary, backgroundColor: C.primaryTint },
    timeBtnText:  { fontSize: FontSize.lg, fontWeight: '700', color: C.ink, letterSpacing: -0.3 },
    timeSep:      { fontSize: FontSize.base, color: C.ink3, fontWeight: '600' },
    confirmBtn: {
      marginTop: Spacing.md, backgroundColor: C.primary,
      borderRadius: Radius.pill, paddingVertical: Spacing.base + 2,
      alignItems: 'center',
    },
    confirmText: { fontSize: FontSize.base, fontWeight: '700', color: '#fff' },
  });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Q8Other() {
  const C = useColors();
  const s = makeStyles(C);
  const setOtherActivity = useUserStore((st) => st.setOtherActivity);
  const stored           = useUserStore((st) => st.otherActivity);
  const { activities, addActivity, updateActivity, removeActivity } = useScheduleStore();

  const [status, setStatus] = useState<ActivityStatus>(
    stored.active ? 'yes' : stored.interested ? 'interested' : stored.active === false ? 'no' : null,
  );
  const [title,     setTitle]     = useState(stored.title     ?? '');
  const [days,      setDays]      = useState<WeekDay[]>(stored.days ?? []);
  const [startTime, setStartTime] = useState(stored.startTime ?? '18:00');
  const [endTime,   setEndTime]   = useState(stored.endTime   ?? '19:00');

  const [extras, setExtras] = useState<OtherEntry[]>(() =>
    activities
      .filter((a) => a.id.startsWith('__other_extra_'))
      .map((a) => ({
        id:        a.id,
        title:     a.title,
        days:      a.days as WeekDay[],
        startTime: a.startTime,
        endTime:   a.endTime,
      })),
  );

  function addExtra() {
    setExtras((prev) => [
      ...prev,
      { id: `extra_${Date.now()}`, title: '', days: [], startTime: '18:00', endTime: '19:00' },
    ]);
  }

  function updateExtra(id: string, patch: Partial<OtherEntry>) {
    setExtras((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function removeExtra(id: string) {
    setExtras((prev) => prev.filter((e) => e.id !== id));
  }

  function handleNext() {
    setOtherActivity({
      active:     status === 'yes',
      interested: status === 'interested',
      title:      status === 'yes' ? title : undefined,
      days:       status === 'yes' ? days : undefined,
      startTime:  status === 'yes' ? startTime : undefined,
      endTime:    status === 'yes' ? endTime : undefined,
    });

    if (status === 'yes' && startTime && endTime) {
      // First activity — stable ID __other__
      const firstData = {
        title: title || 'Autre activité',
        cat: 'activite' as const,
        startTime, endTime, days,
        recurrence: 'weekly' as const,
      };
      if (activities.find((a) => a.id === '__other__')) updateActivity('__other__', firstData);
      else addActivity({ id: '__other__', ...firstData });

      // Remove stale extras then re-add
      activities
        .filter((a) => a.id.startsWith('__other_extra_'))
        .forEach((a) => removeActivity(a.id));

      extras.forEach((extra, i) => {
        addActivity({
          id:         `__other_extra_${i}`,
          title:      extra.title || 'Autre activité',
          cat:        'activite',
          startTime:  extra.startTime,
          endTime:    extra.endTime,
          days:       extra.days,
          recurrence: 'weekly',
        });
      });
    }

    router.push('/(auth)/onboarding/q9-cycle');
  }

  return (
    <OnboardingShell
      step={7}
      eyebrow="Autre activité"
      eyebrowIcon="sparkles-outline"
      question="As-tu une autre activité régulière ?"
      sub="Cours de musique, bénévolat, apprentissage, culture…"
      onBack={() => router.push('/(auth)/onboarding/q7-work')}
      onNext={handleNext}
      nextDisabled={status === null}
      scrollable
    >
      <ActivityBlock
        status={status}
        onStatusChange={setStatus}
        activityName={title}
        onActivityNameChange={setTitle}
        activityPlaceholder="Ex: Cours de piano, Bénévolat, Dessin…"
        days={days}
        onDaysChange={setDays}
        startTime={startTime}
        onStartTimeChange={setStartTime}
        endTime={endTime}
        onEndTimeChange={setEndTime}
      />

      {status === 'yes' && (
        <View style={s.extrasWrapper}>
          {extras.map((extra, i) => (
            <ExtraBlock
              key={extra.id}
              entry={extra}
              index={i}
              onChange={(patch) => updateExtra(extra.id, patch)}
              onRemove={() => removeExtra(extra.id)}
            />
          ))}
          <TouchableOpacity
            style={s.addBtn}
            onPress={addExtra}
            accessibilityLabel="Ajouter une autre activité"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={20} color={C.primary} />
            <Text style={s.addBtnText}>Ajouter une autre activité</Text>
          </TouchableOpacity>
        </View>
      )}
    </OnboardingShell>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    extrasWrapper: { gap: Spacing.md, marginTop: Spacing.sm },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: Spacing.sm, paddingVertical: Spacing.base,
      borderRadius: Radius.input, borderWidth: 1.5,
      borderColor: C.primary,
      backgroundColor: C.primaryTint,
    },
    addBtnText: { fontSize: FontSize.base, fontWeight: '700', color: C.primary },
  });
}
