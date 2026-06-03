import {
  StyleSheet, View, Text, TouchableOpacity, TextInput, Platform,
} from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DayPicker } from './DayPicker';
import { Colors } from '@/constants/Colors';
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

function timeToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const CHOICES: { key: ActivityStatus; label: string; icon: string }[] = [
  { key: 'yes',        label: 'Oui, j\'en fais',  icon: '✓' },
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
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [nameFocused, setNameFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* 3-choice selector */}
      <View style={styles.choices}>
        {CHOICES.map(({ key, label, icon }) => {
          const selected = status === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.choice, selected && styles.choiceActive]}
              onPress={() => onStatusChange(key)}
              accessibilityLabel={label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.choiceIcon, selected && styles.choiceIconActive]}>{icon}</Text>
              <Text style={[styles.choiceLabel, selected && styles.choiceLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Conditional details — only when "yes" */}
      {status === 'yes' && (
        <View style={styles.details}>
          {/* Activity name */}
          <Text style={styles.fieldLabel}>Quoi ?</Text>
          <TextInput
            style={[styles.input, nameFocused && styles.inputFocused]}
            value={activityName}
            onChangeText={onActivityNameChange}
            placeholder={activityPlaceholder ?? 'Ex: Football, Yoga, Piano…'}
            placeholderTextColor={Colors.light.ink3}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            returnKeyType="done"
            accessibilityLabel="Nom de l'activité"
          />

          {/* Days */}
          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Quels jours ?</Text>
          <DayPicker value={days} onChange={onDaysChange} />

          {/* Time range */}
          <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>De quelle heure à quelle heure ?</Text>
          <View style={styles.timeRow}>
            <TouchableOpacity
              style={[styles.timeBtn, activePicker === 'start' && styles.timeBtnActive]}
              onPress={() => setActivePicker(activePicker === 'start' ? null : 'start')}
              accessibilityLabel="Heure de début"
            >
              <Text style={styles.timeBtnText}>{startTime}</Text>
            </TouchableOpacity>
            <Text style={styles.timeSep}>→</Text>
            <TouchableOpacity
              style={[styles.timeBtn, activePicker === 'end' && styles.timeBtnActive]}
              onPress={() => setActivePicker(activePicker === 'end' ? null : 'end')}
              accessibilityLabel="Heure de fin"
            >
              <Text style={styles.timeBtnText}>{endTime}</Text>
            </TouchableOpacity>
          </View>

          {activePicker && (
            <DateTimePicker
              value={timeToDate(activePicker === 'start' ? startTime : endTime)}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minuteInterval={5}
              onChange={(_, date) => {
                if (date) {
                  const t = dateToTime(date);
                  if (activePicker === 'start') onStartTimeChange(t);
                  else onEndTimeChange(t);
                }
                if (Platform.OS === 'android') setActivePicker(null);
              }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },

  choices: { gap: Spacing.sm },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    ...Shadow.sm,
  },
  choiceActive: {
    backgroundColor: Colors.light.primaryTint,
    borderColor: Colors.light.primary,
  },
  choiceIcon:       { fontSize: 16, color: Colors.light.ink3, width: 20, textAlign: 'center' },
  choiceIconActive: { color: Colors.light.primary },
  choiceLabel:      { fontSize: FontSize.base, fontWeight: '600', color: Colors.light.ink2 },
  choiceLabelActive:{ color: Colors.light.primaryStrong },

  details: { gap: Spacing.sm, marginTop: Spacing.xs },

  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.light.ink3,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
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
  },
  inputFocused: { borderColor: Colors.light.primary },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeBtn: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.light.hairline,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadow.sm,
  },
  timeBtnActive: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryTint,
  },
  timeBtnText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.3,
  },
  timeSep: {
    fontSize: FontSize.base,
    color: Colors.light.ink3,
    fontWeight: '600',
  },
});
