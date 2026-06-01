import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';
import { useSuggestionsStore } from '@/store/useSuggestionsStore';

export default function SuggestionsScreen() {
  const suggestions = useSuggestionsStore((s) => s.suggestions);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.suggestions.title}</Text>
        <Text style={styles.subtitle}>{Strings.suggestions.subtitle}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {suggestions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{Strings.suggestions.empty}</Text>
          </View>
        ) : (
          suggestions
            .filter((s) => !s.dismissed)
            .map((sg) => (
              <View key={sg.id} style={styles.card} accessibilityLabel={sg.title}>
                <Text style={styles.cardTitle}>{sg.title}</Text>
                <Text style={styles.cardDur}>{sg.durationMinutes} min</Text>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.ink,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.light.ink3,
    marginTop: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  emptyWrap: {
    paddingTop: Spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.ink3,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.light.ink,
    letterSpacing: -0.2,
  },
  cardDur: {
    fontSize: FontSize.sm,
    color: Colors.light.ink3,
    marginTop: 4,
  },
});
