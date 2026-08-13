/**
 * haptics.test.ts
 * Unit tests for the HapticsService.
 * expo-haptics is mocked — tests verify correct API calls and enable/disable toggling.
 */

// Mock expo-haptics before any imports
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
  NotificationFeedbackType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error',
  },
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock Platform so the service thinks it's on iOS
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import { hapticsService, HapticPatterns } from '../haptics';
import * as Haptics from 'expo-haptics';

beforeEach(() => {
  jest.clearAllMocks();
  hapticsService.setEnabled(true);
});

describe('HapticsService', () => {
  describe('enable/disable toggle', () => {
    test('lightTap fires when enabled', async () => {
      await hapticsService.lightTap();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    test('lightTap does NOT fire when disabled', async () => {
      hapticsService.setEnabled(false);
      await hapticsService.lightTap();
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });

    test('successHeavy fires Heavy impact', async () => {
      await hapticsService.successHeavy();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
    });

    test('mediumTap fires Medium impact', async () => {
      await hapticsService.mediumTap();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });
  });

  describe('notification patterns', () => {
    test('successNotification fires Success type', async () => {
      await hapticsService.successNotification();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    });

    test('warningNotification fires Warning type', async () => {
      await hapticsService.warningNotification();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Warning);
    });

    test('errorNotification fires Error type', async () => {
      await hapticsService.errorNotification();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
    });
  });

  describe('composite patterns', () => {
    test('failureDoubleTap fires Heavy twice', async () => {
      jest.useFakeTimers();
      const promise = hapticsService.failureDoubleTap();
      jest.runAllTimers();
      await promise;
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
      jest.useRealTimers();
    });

    test('correctAnswerCombo fires Heavy then Success notification', async () => {
      jest.useFakeTimers();
      hapticsService.correctAnswerCombo();
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Heavy);
      jest.runAllTimers();
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
      jest.useRealTimers();
    });
  });

  describe('HapticPatterns shorthand', () => {
    test('HapticPatterns.lightTap delegates to hapticsService', () => {
      const spy = jest.spyOn(hapticsService, 'lightTap');
      HapticPatterns.lightTap();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('selectionChange', () => {
    test('fires selectionAsync', async () => {
      await hapticsService.selectionChange();
      expect(Haptics.selectionAsync).toHaveBeenCalled();
    });
  });
});
