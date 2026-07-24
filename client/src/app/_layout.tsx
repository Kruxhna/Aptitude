import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sprint/[type]"
          options={{ title: 'Daily Sprint', headerBackTitle: 'Cancel' }}
        />
        <Stack.Screen
          name="sprint/results"
          options={{ title: 'Sprint Results', headerLeft: () => null }}
        />
      </Stack>
    </>
  );
}
