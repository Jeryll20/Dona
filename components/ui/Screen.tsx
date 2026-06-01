import { StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/spacing';

interface ScreenProps {
  children: React.ReactNode;
  pad?: boolean;
  style?: ViewStyle;
}

// Scrollable screen shell — matches CLAUDE.md § Screen component
export function Screen({ children, pad = true, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, pad && styles.padded, style]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.light.background },
  scroll:  { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 120 },
  padded:  { paddingHorizontal: Spacing.lg },
});
