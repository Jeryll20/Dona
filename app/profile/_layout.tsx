import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="account" />
      <Stack.Screen name="sleep" />
      <Stack.Screen name="cycle" />
      <Stack.Screen name="meals" />
    </Stack>
  );
}
