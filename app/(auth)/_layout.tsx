import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding/q1-bedtime" />
      <Stack.Screen name="onboarding/q2-sleep-hours" />
      <Stack.Screen name="onboarding/q3-morning-prep" />
      <Stack.Screen name="onboarding/q4-meals" />
      <Stack.Screen name="onboarding/q5-activities" />
      <Stack.Screen name="onboarding/q6-goal" />
      <Stack.Screen name="onboarding/creation" />
      <Stack.Screen name="onboarding/conversation" />
      <Stack.Screen name="onboarding/recap" />
    </Stack>
  );
}
