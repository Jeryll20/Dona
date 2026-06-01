import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { Strings } from '@/constants/strings';

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  const color = focused ? Colors.light.primaryStrong : Colors.light.ink3;
  // Simple text-based fallback icons (replace with icon library later)
  const icons: Record<string, string> = {
    today: '◎',
    week: '▦',
    suggestions: '✦',
    profile: '○',
  };
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <View>
        {/* Placeholder — swap for a proper icon library in a future task */}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: insets.bottom + 6 },
        ],
        tabBarActiveTintColor: Colors.light.primaryStrong,
        tabBarInactiveTintColor: Colors.light.ink3,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{ title: Strings.tabs.today }}
      />
      <Tabs.Screen
        name="week"
        options={{ title: Strings.tabs.week }}
      />
      <Tabs.Screen
        name="suggestions"
        options={{ title: Strings.tabs.suggestions }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: Strings.tabs.profile }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 0,
    marginHorizontal: Spacing.base,
    marginBottom: 8,
    borderRadius: Radius.cardLg,
    position: 'absolute',
    left: 0,
    right: 0,
    ...Shadow.lift,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingVertical: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.light.primaryTint,
  },
});
