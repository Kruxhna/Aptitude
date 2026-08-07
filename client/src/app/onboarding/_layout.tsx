import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="placement" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
}
