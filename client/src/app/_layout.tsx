import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { api } from '../api';
import { colors } from '../theme';
import { AccessibilityProvider, useAccessibility } from '../services/AccessibilityProvider';
import { FeedbackProvider } from '../services/FeedbackProvider';
import { MascotProvider } from '../mascot/MascotContext';
import { initSyncQueueListener } from '../services/syncQueue';
import { useUserStore } from '../stores/useUserStore';

function AppNavigation() {
  const { colors: themeColors, isDark } = useAccessibility();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          contentStyle: {
            backgroundColor: themeColors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="wardrobe"
          options={{ title: 'SPRINTY Wardrobe', presentation: 'modal', headerShown: false }}
        />
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

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    // 1. Initialize background offline sync queue listener
    const unsubscribeSync = initSyncQueueListener();

    // 2. Fetch fresh user profile in background
    useUserStore.getState().fetchUserProfile().catch(() => {});

    // 3. Check onboarding status
    async function checkOnboardingStatus() {
      try {
        const status = await api.getOnboardingStatus();

        // Only redirect if user hasn't completed onboarding AND isn't already on an onboarding screen
        const isOnOnboarding = segments[0] === 'onboarding';

        if (!status.onboardingCompleted && !isOnOnboarding) {
          if (!status.placementCompleted) {
            router.replace('/onboarding/placement');
          } else if (!status.goalsSet) {
            router.replace('/onboarding/goals');
          } else {
            router.replace('/onboarding/tutorial');
          }
        }
      } catch (err) {
        // If API is down, skip onboarding check — let user use the app
        console.warn('Onboarding status check failed:', err);
      } finally {
        setCheckingOnboarding(false);
      }
    }

    checkOnboardingStatus();

    return () => {
      unsubscribeSync();
    };
  }, []);

  if (checkingOnboarding) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <AccessibilityProvider>
      <FeedbackProvider>
        <MascotProvider>
          <AppNavigation />
        </MascotProvider>
      </FeedbackProvider>
    </AccessibilityProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
