import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
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

export function SuggestionCard({ suggestion, onAccept, onDismiss }: SuggestionCardProps) {
  if (suggestion.accepted || suggestion.dismissed) return null;

  return (
    <View style={styles.card} accessibilityLabel={`Suggestion : ${suggestion.title}`}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Icon name={CAT_ICON[suggestion.cat]} size={20} stroke={Colors.light.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>{CAT_LABEL[suggestion.cat]}</Text>
          <Text style={styles.title}>{suggestion.title}</Text>
          <Text style={styles.meta}>{suggestion.durationMinutes} min</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            accessibilityLabel={`Accepter : ${suggestion.title}`}
            accessibilityRole="button"
          >
            <Icon name="check" size={16} stroke={Colors.light.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onDismiss}
            accessibilityLabel={`Ignorer : ${suggestion.title}`}
            accessibilityRole="button"
          >
            <Icon name="x" size={16} stroke={Colors.light.ink3} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
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
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body:  { flex: 1, gap: 2 },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.light.primary, letterSpacing: 0.2 },
  title: { fontSize: FontSize.base, fontWeight: '700', color: Colors.light.ink, letterSpacing: -0.2 },
  meta:  { fontSize: FontSize.sm, color: Colors.light.ink3 },
  actions:    { flexDirection: 'row', gap: Spacing.sm },
  acceptBtn:  {
    width: 32, height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.primaryTint,
    alignItems: 'center', justifyContent: 'center',
  },
  dismissBtn: {
    width: 32, height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceSunk,
    alignItems: 'center', justifyContent: 'center',
  },
});
