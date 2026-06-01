import * as ExpoNotifications from 'expo-notifications';

ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  const { status } = await ExpoNotifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailySuggestion(hour: number, minute: number) {
  await ExpoNotifications.cancelAllScheduledNotificationsAsync();
  await ExpoNotifications.scheduleNotificationAsync({
    content: {
      title: 'Your day, optimized ✦',
      body: 'Dona has new suggestions for your free time.',
    },
    trigger: {
      type: ExpoNotifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}
