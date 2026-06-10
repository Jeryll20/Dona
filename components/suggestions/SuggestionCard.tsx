import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Spacing, Shadow, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Icon, IconName } from '@/components/ui/Icon';
import type { Suggestion, SuggestionCat } from '@/types';

const CAT_ICON: Record<SuggestionCat, IconName> = {
  sport:    'run',
  goal:     'target',
  rest:     'moon',
  social:   'profile',
  admin:    'calendar',
  learning: 'book',
};

const CAT_LABEL: Record<SuggestionCat, string> = {
  sport:    'Sport',
  goal:     'Objectif',
  rest:     'Repos',
  social:   'Social',
  admin:    'Admin',
  learning: 'Apprentissage',
};

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: () => void;
  onDismiss: () => void;
}

function hourToHHMM(h: number): string {
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  const C = useColors();
  const s = makeStyles(C);

  if (suggestion.accepted || suggestion.dismissed) return null;

  const slotLabel = suggestion.startHour !== undefined
    ? `Vers ${hourToHHMM(suggestion.startHour)} · `
    : '';

  return (
    <View style={s.card} accessibilityLabel={`Suggestion : ${suggestion.title}`}>
      <View style={s.row}>
        <View style={s.iconWrap}>
          <Icon name={CAT_ICON[suggestion.cat]} size={20} stroke={C.primary} />
        </View>
        <View style={s.body}>
          <Text style={s.label}>{CAT_LABEL[suggestion.cat]}</Text>
          <Text style={s.title}>{suggestion.title}</Text>
          <Text style={s.meta}>{slotLabel}{suggestion.durationMinutes} min</Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity
            style={s.acceptBtn}
            onPress={onAccept}
            accessibilityLabel={`Accepter : ${suggestion.title}`}
            accessibilityRole="button"
          >
            <Icon name="check" size={16} stroke={C.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.dismissBtn}
            onPress={onDismiss}
            accessibilityLabel={`Ignorer : ${suggestion.title}`}
            accessibilityRole="button"
          >
            <Icon name="x" size={16} stroke={C.ink3} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: Radius.block,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadow.sm,
    },
    row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: Radius.input,
      backgroundColor: C.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body:  { flex: 1, gap: 2 },
    label: { fontSize: FontSize.xs, fontWeight: '600', color: C.primary, letterSpacing: 0.2 },
    title: { fontSize: FontSize.base, fontWeight: '700', color: C.ink, letterSpacing: -0.2 },
    meta:  { fontSize: FontSize.sm, color: C.ink3 },
    actions:    { flexDirection: 'row', gap: Spacing.sm },
    acceptBtn:  {
      width: 32, height: 32,
      borderRadius: Radius.pill,
      backgroundColor: C.primaryTint,
      alignItems: 'center', justifyContent: 'center',
    },
    dismissBtn: {
      width: 32, height: 32,
      borderRadius: Radius.pill,
      backgroundColor: C.surfaceSunk,
      alignItems: 'center', justifyContent: 'center',
    },
  });
}
