import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { TabBar } from '@/components/ui/TabBar';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay } from '@/lib/optimizer';
import { scheduleAllNotifications } from '@/lib/notifications';
import type { TimelineEvent } from '@/types';

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

export default function TabLayout() {
  const sleep      = useUserStore((s) => s.sleep);
  const meals      = useUserStore((s) => s.meals);
  const cycle      = useUserStore((s) => s.cycle);
  const activities = useScheduleStore((s) => s.activities);

  // Reschedule notifications whenever the user's data changes
  useEffect(() => {
    const baseEvents = (sleep.waketime && sleep.bedtime && sleep.prepMinutes != null)
      ? buildDefaultDay(
          { bedtime: sleep.bedtime, waketime: sleep.waketime, prepMinutes: sleep.prepMinutes },
          meals,
        )
      : [];

    const activityEvents: TimelineEvent[] = activities.map((a) => ({
      cat:   a.cat,
      title: a.title,
      start: parseTime(a.startTime),
      end:   parseTime(a.endTime),
    }));

    scheduleAllNotifications({
      events:         [...baseEvents, ...activityEvents],
      cycleTracking:  cycle.tracking ?? false,
      lastPeriodDate: cycle.lastPeriodDate,
      cycleDays:      cycle.cycleDays,
    });
  }, [sleep, meals, cycle, activities]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="activities" options={{ title: 'Activités' }} />
      <Tabs.Screen name="index"      options={{ title: "Aujourd'hui" }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profil' }} />
    </Tabs>
  );
}
