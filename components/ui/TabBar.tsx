import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from './Icon';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type TabDef = { name: string; label: string; icon: IconName };

const TABS: TabDef[] = [
  { name: 'activities', label: 'Activités',   icon: 'list'    },
  { name: 'index',      label: "Aujourd'hui", icon: 'today'   },
  { name: 'profile',    label: 'Profil',      icon: 'profile' },
];

// Fixed bottom navigation — matches CLAUDE.md § TabBar component
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
          >
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Icon
                name={tab.icon}
                size={22}
                stroke={focused ? Colors.light.primaryStrong : Colors.light.ink3}
                sw={focused ? 2 : 1.8}
              />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.card,
    paddingTop: Spacing.sm,
    ...Shadow.lift,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: Spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.light.primaryTint,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.light.ink3,
  },
  labelActive: {
    color: Colors.light.primaryStrong,
    fontWeight: '700',
  },
});
