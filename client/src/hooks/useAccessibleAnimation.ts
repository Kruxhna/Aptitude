import { useCallback } from 'react';
import {
  withTiming,
  withSpring,
  WithTimingConfig,
  WithSpringConfig,
  AnimationCallback,
} from 'react-native-reanimated';
import { useAccessibility } from '../services/AccessibilityProvider';

/**
 * Hook providing accessible animation primitives that respect Reduced Motion preferences.
 * When Reduced Motion is active, bouncing springs and long repeating loops are substituted
 * with instant transitions or subtle 100ms fades.
 */
export function useAccessibleAnimation() {
  let isReducedMotion = false;

  try {
    const acc = useAccessibility();
    isReducedMotion = acc.isReducedMotionActive;
  } catch {
    // Outside AccessibilityProvider
  }

  /**
   * Accessible wrapper around Reanimated's withTiming.
   * If reduced motion is active, duration is capped at 100ms (or 0 for instant changes).
   */
  const accessibleTiming = useCallback(
    (
      toValue: number | string,
      userConfig?: WithTimingConfig,
      callback?: AnimationCallback
    ) => {
      'worklet';
      if (isReducedMotion) {
        return withTiming(
          toValue,
          {
            ...userConfig,
            duration: Math.min(userConfig?.duration ?? 100, 100),
          },
          callback
        );
      }
      return withTiming(toValue, userConfig, callback);
    },
    [isReducedMotion]
  );

  /**
   * Accessible wrapper around Reanimated's withSpring.
   * If reduced motion is active, bouncy spring physics are replaced with a fast, smooth timing fade.
   */
  const accessibleSpring = useCallback(
    (
      toValue: number | string,
      userConfig?: WithSpringConfig,
      callback?: AnimationCallback
    ) => {
      'worklet';
      if (isReducedMotion) {
        return withTiming(
          toValue,
          {
            duration: 100,
          },
          callback
        );
      }
      return withSpring(toValue, userConfig, callback);
    },
    [isReducedMotion]
  );

  return {
    isReducedMotion,
    accessibleTiming,
    accessibleSpring,
  };
}
