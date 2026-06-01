import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface EyebrowProps {
  children: string;
  icon?: IoniconsName;
}

// Small pill label with optional icon — matches CLAUDE.md § Eyebrow component
export function Eyebrow({ children, icon }: EyebrowProps) {
  return (
    <View style={styles.pill}>
      {icon && (
        <Ionicons name={icon} size={13} color={Colors.light.primaryStrong} />
      )}
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primaryTint,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.light.primaryStrong,
    letterSpacing: 0.3,
  },
});
