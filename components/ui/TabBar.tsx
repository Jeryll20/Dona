import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Icon, IconName } from './Icon';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/spacing';
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
  const insets    = useSafeAreaInsets();
  const viewMode  = useScheduleStore((s) => s.viewMode);
  const setViewMode = useScheduleStore((s) => s.setViewMode);

  const todayFocused = state.routes[state.index]?.name === 'index';

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 4 }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab     = TABS.find((t) => t.name === route.name) ?? TABS[0];
        const isToday = tab.name === 'index';

        return (
          <TouchableOpacity
            key={route.key}
            style={[styles.tab, isToday && todayFocused && styles.tabTodayActive]}
            onPress={() => { if (!focused) navigation.navigate(route.name); }}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            activeOpacity={0.8}
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

            {/* View mode selector — only on focused today tab */}
            {isToday && todayFocused && (
              <View style={styles.viewPills}>
                {VIEW_MODES.map((v) => (
                  <TouchableOpacity
                    key={v.key}
                    style={[styles.pill, viewMode === v.key && styles.pillActive]}
                    onPress={(e) => { (e as any).stopPropagation?.(); setViewMode(v.key); }}
                    hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
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
    paddingTop: Spacing.xs,
    ...Shadow.lift,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 3,
  },
  tabTodayActive: {
    paddingBottom: Spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 10,
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

  viewPills: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceSunk,
    borderRadius: Radius.pill,
    padding: 2,
    marginTop: 4,
    gap: 0,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  pillActive: {
    backgroundColor: Colors.light.primary,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.ink3,
  },
  pillTextActive: {
    color: Colors.light.onPrimary,
  },
});
