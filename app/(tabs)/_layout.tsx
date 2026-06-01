import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IoniconsName; iconFocused: IoniconsName }[] = [
  { name: 'today',      label: "Aujourd'hui", icon: 'today-outline',   iconFocused: 'today' },
  { name: 'activities', label: 'Mes activités', icon: 'list-outline',   iconFocused: 'list' },
  { name: 'profile',   label: 'Mon profil',   icon: 'person-outline', iconFocused: 'person' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarStyle: [styles.tabBar, { paddingBottom: insets.bottom + 4 }],
          tabBarActiveTintColor: Colors.light.primaryStrong,
          tabBarInactiveTintColor: Colors.light.ink3,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Ionicons
                name={focused ? tab?.iconFocused ?? tab?.icon : tab?.icon ?? 'today-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        };
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: 0,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
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
    paddingVertical: Spacing.sm,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.light.primaryTint,
  },
});
