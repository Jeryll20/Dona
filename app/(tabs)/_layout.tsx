import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { TabBar } from '@/components/ui/TabBar';
import { useUserStore } from '@/store/useUserStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { buildDefaultDay } from '@/lib/optimizer';
import { scheduleAllNotifications } from '@/lib/notifications';
import type { TimelineEvent } from '@/types';

function migrateProfileActivities() {
  const acts = useScheduleStore.getState().activities;
  const add   = useScheduleStore.getState().addActivity;
  const w = useUserStore.getState().work;
  const s = useUserStore.getState().sport;
  const o = useUserStore.getState().otherActivity;
  if (w.employed && w.startTime && w.endTime && !acts.find((a) => a.id === '__work__')) {
    add({ id: '__work__', title: w.role || 'Emploi', cat: 'travail', startTime: w.startTime!, endTime: w.endTime!, days: w.days ?? [], recurrence: 'weekly' });
  }
  if (s.active && s.startTime && s.endTime && !acts.find((a) => a.id === '__sport__')) {
    add({ id: '__sport__', title: s.activity || 'Sport & Activité', cat: 'activite', startTime: s.startTime!, endTime: s.endTime!, days: s.days ?? [], recurrence: 'weekly' });
  }
  if (o.active && o.startTime && o.endTime && !acts.find((a) => a.id === '__other__')) {
    add({ id: '__other__', title: o.title || 'Autre activité', cat: 'activite', startTime: o.startTime!, endTime: o.endTime!, days: o.days ?? [], recurrence: 'weekly' });
  }
}

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h + m / 60;
}

export default function TabLayout() {
  const sleep      = useUserStore((s) => s.sleep);
  const meals      = useUserStore((s) => s.meals);
  const cycle      = useUserStore((s) => s.cycle);
  const activities = useScheduleStore((s) => s.activities);

  // Migrate profile-store activities → schedule store once on startup
  useEffect(() => { migrateProfileActivities(); }, []);

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

    const punctualActivities = activities
      .filter((a) => a.recurrence === 'none' && a.notifyWeekEnd)
      .map((a) => ({ id: a.id, title: a.title }));

    scheduleAllNotifications({
      events:              [...baseEvents, ...activityEvents],
      cycleTracking:       cycle.tracking ?? false,
      lastPeriodDate:      cycle.lastPeriodDate,
      cycleDays:           cycle.cycleDays,
      punctualActivities,
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
