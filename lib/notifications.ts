import * as Notif from 'expo-notifications';
import { Platform } from 'react-native';
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

  const content = {
    title: 'Mise à jour du cycle 🌸',
    body:  'Un nouveau mois commence ! Pense à mettre à jour la date de tes dernières règles.',
  };

  if (Platform.OS === 'android') {
    // CALENDAR triggers are iOS-only — Android throws "Trigger of type:
    // calendar is not supported". Schedule a one-shot DATE trigger for the
    // next 1st of month instead; scheduleAllNotifications re-runs at every
    // app launch, which renews it month after month.
    const now  = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
    await Notif.scheduleNotificationAsync({
      identifier: ID_CYCLE,
      content,
      trigger: { type: Notif.SchedulableTriggerInputTypes.DATE, date: next },
    });
    return;
  }

  await Notif.scheduleNotificationAsync({
    identifier: ID_CYCLE,
    content,
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
    // Navigate to /weekly-report when tapped (handled in _layout notification listener)
  });
}

export async function cancelWeeklyRecap(): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_WEEKLY).catch(() => null);
}

// ── 4. Notification de changement de phase ───────────────────────────────────

const ID_PHASE = 'dona-phase-change';

const PHASE_MESSAGES: Record<string, { title: string; body: string }> = {
  menstrual:  { title: 'Tes règles ont commencé 🌸', body: 'Prends soin de toi — repos et douceur sont au programme.' },
  follicular: { title: 'Phase folliculaire 💪',       body: 'Ton énergie remonte ! C\'est le moment de te lancer.' },
  ovulation:  { title: 'Tu es en ovulation ✨',        body: 'Pic d\'énergie et de sociabilité — profites-en !' },
  luteal:     { title: 'Phase lutéale 🌿',             body: 'Ton corps se prépare. Douceur et routine sont tes alliées.' },
};

export async function schedulePhaseChangeNotification(
  lastPeriodDate: string,
  cycleDays: number,
): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_PHASE).catch(() => null);

  const PHASE_ENDS: Record<string, number> = {
    menstrual: 5, follicular: 13, ovulation: 16, luteal: cycleDays,
  };

  const past    = new Date(lastPeriodDate);
  const today   = new Date();
  past.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const elapsed = Math.floor((today.getTime() - past.getTime()) / 86_400_000) % cycleDays;

  let currentPhase: string;
  let nextPhase: string;
  let daysLeft: number;

  if (elapsed <= 5)  { currentPhase = 'menstrual';  nextPhase = 'follicular'; daysLeft = 5  - elapsed + 1; }
  else if (elapsed <= 13) { currentPhase = 'follicular'; nextPhase = 'ovulation';  daysLeft = 13 - elapsed + 1; }
  else if (elapsed <= 16) { currentPhase = 'ovulation';  nextPhase = 'luteal';     daysLeft = 16 - elapsed + 1; }
  else                    { currentPhase = 'luteal';     nextPhase = 'menstrual';   daysLeft = cycleDays - elapsed + 1; }

  void currentPhase; // used for future expansion

  const notifDate = new Date();
  notifDate.setDate(notifDate.getDate() + daysLeft);
  notifDate.setHours(9, 0, 0, 0);

  const msg = PHASE_MESSAGES[nextPhase];
  await Notif.scheduleNotificationAsync({
    identifier: ID_PHASE,
    content: { title: msg.title, body: msg.body },
    trigger: {
      type: Notif.SchedulableTriggerInputTypes.DATE,
      date: notifDate,
    },
  });
}

export async function cancelPhaseChangeNotification(): Promise<void> {
  await Notif.cancelScheduledNotificationAsync(ID_PHASE).catch(() => null);
}

// ── 5. Rappel dimanche soir pour activités ponctuelles ───────────────────────

const ID_PUNCTUAL_PFX = 'dona-punctual-';

export async function schedulePunctualWeekEndReminders(
  activities: { id: string; title: string }[],
): Promise<void> {
  const scheduled = await Notif.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PUNCTUAL_PFX))
      .map((n) => Notif.cancelScheduledNotificationAsync(n.identifier)),
  );

  await Promise.all(
    activities.map((act) =>
      Notif.scheduleNotificationAsync({
        identifier: `${ID_PUNCTUAL_PFX}${act.id}`,
        content: {
          title: `Planifier "${act.title}" 📅`,
          body:  'Pense à le reconfigurer pour la semaine prochaine si besoin !',
        },
        trigger: {
          type:    Notif.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour:    20,
          minute:  30,
        },
      }),
    ),
  );
}

// ── API principale ────────────────────────────────────────────────────────────

export interface NotifConfig {
  events:             TimelineEvent[];
  cycleTracking:      boolean;
  lastPeriodDate?:    string;
  cycleDays?:         number;
  punctualActivities?: { id: string; title: string }[];
}

export async function scheduleAllNotifications({
  events,
  cycleTracking,
  lastPeriodDate,
  cycleDays,
  punctualActivities = [],
}: NotifConfig): Promise<void> {
  const granted = await requestPermissions();
  if (!granted) return;

  await Promise.all([
    cycleTracking ? scheduleCycleReminder() : cancelCycleReminder(),
    cycleTracking && lastPeriodDate
      ? schedulePhaseChangeNotification(lastPeriodDate, cycleDays ?? 28)
      : cancelPhaseChangeNotification(),
    scheduleActivityReminders(events),
    scheduleWeeklyRecap(),
    schedulePunctualWeekEndReminders(punctualActivities),
  ]);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notif.cancelAllScheduledNotificationsAsync();
}
