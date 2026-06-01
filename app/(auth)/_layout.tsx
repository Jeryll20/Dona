import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding/step1-personal" />
      <Stack.Screen name="onboarding/step2-sleep" />
      <Stack.Screen name="onboarding/step3-meals" />
      <Stack.Screen name="onboarding/step4-sport" />
      <Stack.Screen name="onboarding/step5-work" />
      <Stack.Screen name="onboarding/step6-activities" />
      <Stack.Screen name="onboarding/step7-cycle" />
    </Stack>
  );
}
