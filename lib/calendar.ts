import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import type { UserActivity, WeekDay } from '@/types';

const DONA_CALENDAR_TITLE = 'Dona';
const DONA_CALENDAR_COLOR = '#7C6FCD';

// expo-calendar convention: 1=Sunday, 2=Monday … 7=Saturday
const WEEKDAY_NUM: Record<WeekDay, number> = {
  Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7, Sun: 1,
};

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getOrCreateDonaCalendar(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const existing = calendars.find(
    (c) => c.title === DONA_CALENDAR_TITLE && c.allowsModifications,
  );
  if (existing) return existing.id;

  let sourceId: string | undefined;
  if (Platform.OS === 'ios') {
    const defaultCal = await Calendar.getDefaultCalendarAsync();
    sourceId = defaultCal.source?.id;
  }

  return Calendar.createCalendarAsync({
    title:       DONA_CALENDAR_TITLE,
    color:       DONA_CALENDAR_COLOR,
    entityType:  Calendar.EntityTypes.EVENT,
    sourceId,
    name:        'donaCalendar',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

function buildDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function exportActivityToCalendar(
  activity: UserActivity,
  calendarId: string,
): Promise<void> {
  const [startH, startM] = activity.startTime.split(':').map(Number);
  const [endH,   endM  ] = activity.endTime.split(':').map(Number);

  await Calendar.createEventAsync(calendarId, {
    title: activity.title,
    startDate: buildDate(startH, startM),
    endDate:   buildDate(endH,   endM),
    recurrenceRule: {
      frequency: Calendar.Frequency.WEEKLY,
      daysOfTheWeek: activity.days.map((d) => ({
        dayOfTheWeek: WEEKDAY_NUM[d],
        weekNumber: 0,
      })),
    },
    notes: `Activité Dona · ${activity.cat}`,
  });
}

export async function exportAllActivitiesToCalendar(
  activities: UserActivity[],
): Promise<{ success: number; calendarId: string }> {
  const calendarId = await getOrCreateDonaCalendar();
  let success = 0;
  for (const act of activities) {
    try {
      await exportActivityToCalendar(act, calendarId);
      success++;
    } catch {
      // individual failures are non-fatal
    }
  }
  return { success, calendarId };
}
