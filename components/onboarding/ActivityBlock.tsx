import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
} from 'react-native';
import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { TimeField } from '@/components/ui/TimeField';
import { DayPicker } from './DayPicker';
import { useColors } from '@/hooks/useColors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import type { WeekDay } from '@/types';

export type ActivityStatus = 'yes' | 'no' | 'interested' | null;

interface ActivityBlockProps {
  status: ActivityStatus;
  onStatusChange: (s: ActivityStatus) => void;
  yesLabel?: string;
  activityName: string;
  onActivityNameChange: (s: string) => void;
  activityPlaceholder?: string;
  days: WeekDay[];
  onDaysChange: (d: WeekDay[]) => void;
  startTime: string;
  onStartTimeChange: (t: string) => void;
  endTime: string;
  onEndTimeChange: (t: string) => void;
}

const CHOICES: { key: ActivityStatus; label: string; icon: string }[] = [
  { key: 'yes',        label: 'Oui, c\'est le cas', icon: '✓' },
  { key: 'no',         label: 'Non',               icon: '✗' },
  { key: 'interested', label: 'J\'aimerais bien',  icon: '◯' },
];

export function ActivityBlock({
  status, onStatusChange,
  yesLabel, activityName, onActivityNameChange, activityPlaceholder,
  days, onDaysChange,
  startTime, onStartTimeChange,
  endTime, onEndTimeChange,
}: ActivityBlockProps) {
  const C = useColors();
  const s = makeStyles(C);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [tempTime, setTempTime] = useState('');
  const [nameFocused, setNameFocused] = useState(false);

  function openPicker(target: 'start' | 'end') {
    setTempTime(target === 'start' ? startTime : endTime);
    setPickerTarget(target);
  }

  function confirmTime() {
    if (pickerTarget === 'start') onStartTimeChange(tempTime);
    else if (pickerTarget === 'end') onEndTimeChange(tempTime);
    setPickerTarget(null);
  }

  return (
    <View style={s.container}>
      {/* 3-choice selector */}
      <View style={s.choices}>
        {CHOICES.map(({ key, label, icon }) => {
          const selected = status === key;
          return (
            <TouchableOpacity
              key={key}
              style={[s.choice, selected && s.choiceActive]}
              onPress={() => onStatusChange(key)}
              accessibilityLabel={label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[s.choiceIcon, selected && s.choiceIconActive]}>{icon}</Text>
              <Text style={[s.choiceLabel, selected && s.choiceLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Conditional details — only when "yes" */}
      {status === 'yes' && (
        <View style={s.details}>
          {/* Activity name */}
          <Text style={s.fieldLabel}>Quoi ?</Text>
          <TextInput
            style={[s.input, nameFocused && s.inputFocused]}
            value={activityName}
            onChangeText={onActivityNameChange}
            placeholder={activityPlaceholder ?? 'Ex: Football, Yoga, Piano…'}
            placeholderTextColor={C.ink3}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            returnKeyType="done"
            accessibilityLabel="Nom de l'activité"
          />

          {/* Days */}
          <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>Quels jours ?</Text>
          <DayPicker value={days} onChange={onDaysChange} />

          {/* Time range */}
          <Text style={[s.fieldLabel, { marginTop: Spacing.md }]}>De quelle heure à quelle heure ?</Text>
          <View style={s.timeRow}>
            <TouchableOpacity
              style={[s.timeBtn, pickerTarget === 'start' && s.timeBtnActive]}
              onPress={() => openPicker('start')}
              accessibilityLabel="Heure de début"
            >
              <Text style={s.timeBtnText}>{startTime}</Text>
            </TouchableOpacity>
            <Text style={s.timeSep}>→</Text>
            <TouchableOpacity
              style={[s.timeBtn, pickerTarget === 'end' && s.timeBtnActive]}
              onPress={() => openPicker('end')}
              accessibilityLabel="Heure de fin"
            >
              <Text style={s.timeBtnText}>{endTime}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Sheet
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        title={pickerTarget === 'start' ? 'Heure de début' : 'Heure de fin'}
      >
        <TimeField value={tempTime} onChange={setTempTime} />
        <TouchableOpacity
          style={s.confirmBtn}
          onPress={confirmTime}
          accessibilityLabel="Valider l'heure"
          accessibilityRole="button"
        >
          <Text style={s.confirmText}>Valider</Text>
        </TouchableOpacity>
      </Sheet>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { gap: Spacing.md },

    choices: { gap: Spacing.sm },
    choice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      padding: Spacing.base,
      borderWidth: 1.5,
      borderColor: C.hairline,
      ...Shadow.sm,
    },
    choiceActive: {
      backgroundColor: C.primaryTint,
      borderColor: C.primary,
    },
    choiceIcon:       { fontSize: 16, color: C.ink3, width: 20, textAlign: 'center' },
    choiceIconActive: { color: C.primary },
    choiceLabel:      { fontSize: FontSize.base, fontWeight: '600', color: C.ink2 },
    choiceLabelActive:{ color: C.primaryStrong },

    details: { gap: Spacing.sm, marginTop: Spacing.xs },

    fieldLabel: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: C.ink3,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 4,
    },

    input: {
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: C.hairline,
      paddingHorizontal: Spacing.base,
      paddingVertical: 14,
      fontSize: FontSize.base,
      fontWeight: '500',
      color: C.ink,
    },
    inputFocused: { borderColor: C.primary },

    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    timeBtn: {
      flex: 1,
      backgroundColor: C.surface,
      borderRadius: Radius.input,
      borderWidth: 1.5,
      borderColor: C.hairline,
      paddingVertical: 14,
      alignItems: 'center',
      ...Shadow.sm,
    },
    timeBtnActive: {
      borderColor: C.primary,
      backgroundColor: C.primaryTint,
    },
    timeBtnText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: C.ink,
      letterSpacing: -0.3,
    },
    timeSep: {
      fontSize: FontSize.base,
      color: C.ink3,
      fontWeight: '600',
    },

    confirmBtn: {
      marginTop: Spacing.md,
      backgroundColor: C.primary,
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
  });
}
