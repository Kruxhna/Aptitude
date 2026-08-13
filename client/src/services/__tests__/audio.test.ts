/**
 * audio.test.ts
 * Unit tests for the AudioService singleton.
 * expo-av is mocked — tests verify volume mapping, enable/disable, and named methods.
 */

const mockSetVolumeAsync = jest.fn().mockResolvedValue(undefined);
const mockReplayAsync = jest.fn().mockResolvedValue(undefined);
const mockUnloadAsync = jest.fn().mockResolvedValue(undefined);
const mockCreateAsync = jest.fn().mockResolvedValue({
  sound: {
    setVolumeAsync: mockSetVolumeAsync,
    replayAsync: mockReplayAsync,
    unloadAsync: mockUnloadAsync,
  },
});
const mockSetAudioModeAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: mockCreateAsync,
    },
    setAudioModeAsync: mockSetAudioModeAsync,
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Stub all require() calls for MP3 assets to avoid bundler errors
jest.mock('../../assets/audio/pop-correct.mp3', () => 1, { virtual: true });
jest.mock('../../assets/audio/descending-wrong.mp3', () => 2, { virtual: true });
jest.mock('../../assets/audio/streak-chime.mp3', () => 3, { virtual: true });
jest.mock('../../assets/audio/level-up.mp3', () => 4, { virtual: true });
jest.mock('../../assets/audio/sprint-start.mp3', () => 5, { virtual: true });
jest.mock('../../assets/audio/sprint-end.mp3', () => 6, { virtual: true });
jest.mock('../../assets/audio/timer-tick.mp3', () => 7, { virtual: true });
jest.mock('../../assets/audio/button-tap.mp3', () => 8, { virtual: true });
jest.mock('../../assets/audio/xp-earn.mp3', () => 9, { virtual: true });
jest.mock('../../assets/audio/mascot-jump.mp3', () => 10, { virtual: true });

import { audioService } from '../audio';

beforeEach(() => {
  jest.clearAllMocks();
  audioService.setEnabled(true);
  audioService.setVolume(100);
});

describe('AudioService', () => {
  describe('loadSounds()', () => {
    test('calls setAudioModeAsync to configure session', async () => {
      await audioService.loadSounds();
      expect(mockSetAudioModeAsync).toHaveBeenCalledTimes(1);
    });

    test('creates sound objects for all 10 tracks', async () => {
      await audioService.loadSounds();
      expect(mockCreateAsync).toHaveBeenCalledTimes(10);
    });
  });

  describe('volume mapping', () => {
    test('masterVolumeFraction maps 100% → 1.0', () => {
      audioService.setVolume(100);
      expect(audioService.masterVolumeFraction).toBeCloseTo(1.0);
    });

    test('masterVolumeFraction maps 0% → 0.0', () => {
      audioService.setVolume(0);
      expect(audioService.masterVolumeFraction).toBeCloseTo(0.0);
    });

    test('masterVolumeFraction maps 70% → 0.7', () => {
      audioService.setVolume(70);
      expect(audioService.masterVolumeFraction).toBeCloseTo(0.7);
    });

    test('setVolume clamps above 100 to 1.0', () => {
      audioService.setVolume(200);
      expect(audioService.masterVolumeFraction).toBeCloseTo(1.0);
    });

    test('setVolume clamps below 0 to 0.0', () => {
      audioService.setVolume(-50);
      expect(audioService.masterVolumeFraction).toBeCloseTo(0.0);
    });
  });

  describe('enable/disable', () => {
    test('playSound does NOT play when disabled', async () => {
      await audioService.loadSounds();
      audioService.setEnabled(false);
      audioService.correct();
      // Give async play a tick to resolve
      await new Promise(r => setTimeout(r, 50));
      expect(mockReplayAsync).not.toHaveBeenCalled();
    });

    test('playSound plays when enabled', async () => {
      await audioService.loadSounds();
      audioService.setEnabled(true);
      audioService.correct();
      await new Promise(r => setTimeout(r, 50));
      expect(mockReplayAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('named methods', () => {
    beforeEach(async () => {
      await audioService.loadSounds();
    });

    const namedMethods = [
      'correct', 'wrong', 'streakChime', 'levelUp',
      'sprintStart', 'sprintEnd', 'buttonTap', 'xpEarn',
      'mascotJump', 'timerTick',
    ] as const;

    test.each(namedMethods.map(m => [m]))('%s() fires replayAsync', async (method) => {
      jest.clearAllMocks();
      (audioService[method] as () => void)();
      await new Promise(r => setTimeout(r, 50));
      expect(mockReplayAsync).toHaveBeenCalled();
    });
  });

  describe('unloadAll()', () => {
    test('calls unloadAsync for each loaded sound', async () => {
      await audioService.loadSounds();
      await audioService.unloadAll();
      expect(mockUnloadAsync).toHaveBeenCalledTimes(10);
    });
  });
});
