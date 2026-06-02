import * as Notif from 'expo-notifications';
import type { TimelineEvent } from '@/types';

// ── Handler global (affiché même app au premier plan) ────────────────────────

Notif.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

// ── Identifiants stables pour pouvoir annuler individuellement ───────────────

const ID_CYCLE   = 'dona-cycle-reminder';
const ID_WEEKLY  = 'dona-weekly-recap';
const ID_ACT_PFX = 'dona-activity-';

// ── Permissions ───────────────────────────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notif.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notif.requestPermissionsAsync();
  return status === 'granted';
}

// ── 1. Rappel cycle — le 1er de chaque mois à 9h ────────────────────────────

export async function scheduleCycleReminder(): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_CYCLE).catch(() => null);
  await Notif.scheduleNotificationAsync({
    identifier: ID_CYCLE,
    content: {
      title: 'Mise à jour du cycle 🌸',
      body:  'Un nouveau mois commence ! Pense à mettre à jour la date de tes dernières règles.',
    },
    trigger: {
      type:    Notif.SchedulableTriggerInputTypes.CALENDAR,
      day:     1,
      hour:    9,
      minute:  0,
      repeats: true,
    },
  });
}

export async function cancelCycleReminder(): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_CYCLE).catch(() => null);
}

// ── 2. Rappels activités — 15 min avant chaque activité planifiée ─────────────

function remindTime(startDecimal: number): { hour: number; minute: number } | null {
  const remind = startDecimal - 15 / 60;
  if (remind < 0) return null; // activité trop tôt dans la nuit
  const hour   = Math.floor(remind);
  const minute = Math.round((remind - hour) * 60);
  return { hour, minute };
}

export async function scheduleActivityReminders(events: TimelineEvent[]): Promise<void> {
  // Annuler les anciens rappels d'activité
  const scheduled = await Notif.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_ACT_PFX))
      .map((n) => Notif.cancelScheduledNotificationAsync(n.identifier)),
  );

  const visible = events.filter((e) => !e.thin && e.cat !== 'sommeil' && e.cat !== 'prep');

  await Promise.all(
    visible.map(async (ev, i) => {
      const t = remindTime(ev.start);
      if (!t) return;
      await Notif.scheduleNotificationAsync({
        identifier: `${ID_ACT_PFX}${i}`,
        content: {
          title: `${ev.title} dans 15 min ⏰`,
          body:  "C'est bientôt l'heure !",
        },
        trigger: {
          type:   Notif.SchedulableTriggerInputTypes.DAILY,
          hour:   t.hour,
          minute: t.minute,
        },
      });
    }),
  );
}

export async function cancelActivityReminders(): Promise<void> {
  const scheduled = await Notif.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_ACT_PFX))
      .map((n) => Notif.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// ── 3. Bilan hebdomadaire — dimanche 20h ──────────────────────────────────────

export async function scheduleWeeklyRecap(): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_WEEKLY).catch(() => null);
  await Notif.scheduleNotificationAsync({
    identifier: ID_WEEKLY,
    content: {
      title: 'Bilan de la semaine 📋',
      body:  "La semaine s'achève. Pense à noter tes rendez-vous pour la semaine prochaine !",
    },
    trigger: {
      type:    Notif.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // 1 = dimanche (convention iOS/Expo)
      hour:    20,
      minute:  0,
    },
  });
}

export async function cancelWeeklyRecap(): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_WEEKLY).catch(() => null);
}

// ── API principale ────────────────────────────────────────────────────────────

export interface NotifConfig {
  events:        TimelineEvent[];
  cycleTracking: boolean;
}

export async function scheduleAllNotifications({ events, cycleTracking }: NotifConfig): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  await Promise.all([
    cycleTracking ? scheduleCycleReminder() : cancelCycleReminder(),
    scheduleActivityReminders(events),
    scheduleWeeklyRecap(),
  ]);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notif.cancelAllScheduledNotificationsAsync();
}
