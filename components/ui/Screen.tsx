import { StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/spacing';

interface ScreenProps {
  children: React.ReactNode;
  pad?: boolean;
  style?: ViewStyle;
}

// Scrollable screen shell — matches CLAUDE.md § Screen component
export function Screen({ children, pad = true, style }: ScreenProps) {
  const C = useColors();
  const s = makeStyles(C);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, pad && s.padded, style]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe:    { flex: 1, backgroundColor: C.background },
    scroll:  { flex: 1 },
    content: { flexGrow: 1, paddingBottom: 120 },
    padded:  { paddingHorizontal: Spacing.lg },
  });
}
