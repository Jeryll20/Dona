import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from './Icon';
import { useColors } from '@/hooks/useColors';
import { Spacing, Shadow } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';

type TabDef = { name: string; label: string; icon: IconName };

const TABS: TabDef[] = [
  { name: 'activities', label: 'Activités',   icon: 'list'    },
  { name: 'index',      label: "Aujourd'hui", icon: 'today'   },
  { name: 'profile',    label: 'Profil',      icon: 'profile' },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const C      = useColors();
  const insets = useSafeAreaInsets();
  const s      = makeStyles(C);

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || Spacing.base }]}>
      <View style={s.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab     = TABS.find((t) => t.name === route.name) ?? TABS[0];

          return (
            <TouchableOpacity
              key={route.key}
              style={[s.tab, focused && s.tabActive]}
              onPress={() => { if (!focused) navigation.navigate(route.name); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={22}
                stroke={focused ? C.primaryStrong : C.ink3}
                sw={focused ? 2.2 : 1.6}
              />
              <Text style={[s.label, focused && s.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      backgroundColor: C.background,
      paddingTop: 8,
    },

    pill: {
      flexDirection: 'row',
      marginHorizontal: 16,
      backgroundColor: C.surface,
      borderRadius: 26,
      padding: 7,
      ...Shadow.lift,
    },

    tab: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: 9,
      borderRadius: 18,
    },
    tabActive: {
      backgroundColor: C.primaryTint,
    },

    label: {
      fontSize: FontSize.xs,
      fontWeight: '600',
      color: C.ink3,
    },
    labelActive: {
      color: C.primaryStrong,
      fontWeight: '700',
    },
  });
}
