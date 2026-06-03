import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from './Icon';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/spacing';
import { FontSize } from '@/constants/typography';
import { useScheduleStore, ViewMode } from '@/store/useScheduleStore';

type TabDef = { name: string; label: string; icon: IconName };

const TABS: TabDef[] = [
  { name: 'activities', label: 'Activités',   icon: 'list'    },
  { name: 'index',      label: "Aujourd'hui", icon: 'today'   },
  { name: 'profile',    label: 'Profil',      icon: 'profile' },
];

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'day',   label: 'Jour' },
  { key: 'week',  label: 'Sem'  },
  { key: 'month', label: 'Mois' },
];

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets      = useSafeAreaInsets();
  const viewMode    = useScheduleStore((s) => s.viewMode);
  const setViewMode = useScheduleStore((s) => s.setViewMode);

  const todayFocused = state.routes[state.index]?.name === 'index';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || Spacing.sm }]}>

      {/* Tab icons + labels */}
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tab     = TABS.find((t) => t.name === route.name) ?? TABS[0];

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={() => { if (!focused) navigation.navigate(route.name); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Icon
                  name={tab.icon}
                  size={22}
                  stroke={focused ? Colors.light.primaryStrong : Colors.light.ink3}
                  sw={focused ? 2.2 : 1.6}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* View mode pills — inside the bar, below all tabs, only when today is active */}
      {todayFocused && (
        <View style={styles.pillsRow}>
          {VIEW_MODES.map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[styles.pill, viewMode === v.key && styles.pillActive]}
              onPress={() => setViewMode(v.key)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={v.label}
              accessibilityState={{ selected: viewMode === v.key }}
            >
              <Text style={[styles.pillText, viewMode === v.key && styles.pillTextActive]}>
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.hairline,
    paddingTop: Spacing.sm,
  },

  tabRow: {
    flexDirection: 'row',
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingBottom: Spacing.xs,
  },

  iconWrap: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.pill,
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

  // Pills row — below all three tabs, centered in the bar
  pillsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.pill,
    padding: 2,
    marginBottom: Spacing.xs,
    gap: 0,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  pillActive: {
    backgroundColor: Colors.light.primary,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.ink3,
  },
  pillTextActive: {
    color: Colors.light.onPrimary,
    fontWeight: '700',
  },
});
