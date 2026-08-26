import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  useColorScheme as useSystemColorScheme,
  AccessibilityInfo,
  Appearance,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ThemeMode,
  ColorBlindMode,
  ThemeColors,
  getPalette,
  Fonts,
} from '../constants/theme';

export interface AccessibilityPreferences {
  themeMode: ThemeMode;
  isHighContrast: boolean;
  isDyslexicFont: boolean;
  reducedMotion: boolean | 'system';
  colorBlindMode: ColorBlindMode;
}

const DEFAULT_ACCESSIBILITY_PREFS: AccessibilityPreferences = {
  themeMode: 'system',
  isHighContrast: false,
  isDyslexicFont: false,
  reducedMotion: 'system',
  colorBlindMode: 'none',
};

const STORAGE_KEY = '@gate_aptitude_accessibility_prefs_v1';

export interface AccessibilityContextValue {
  preferences: AccessibilityPreferences;
  themeMode: ThemeMode;
  isHighContrast: boolean;
  isDyslexicFont: boolean;
  reducedMotion: boolean | 'system';
  colorBlindMode: ColorBlindMode;
  isDark: boolean;
  isReducedMotionActive: boolean;
  colors: ThemeColors;
  fontFamily?: string;
  updatePreferences: (patch: Partial<AccessibilityPreferences>) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setIsHighContrast: (val: boolean) => Promise<void>;
  setIsDyslexicFont: (val: boolean) => Promise<void>;
  setReducedMotion: (val: boolean | 'system') => Promise<void>;
  setColorBlindMode: (val: ColorBlindMode) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(
    DEFAULT_ACCESSIBILITY_PREFS
  );
  const [systemReduceMotion, setSystemReduceMotion] = useState<boolean>(false);

  // ── Load Persisted Preferences ──────────────────────────────
  useEffect(() => {
    async function loadPrefs() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences((prev) => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.warn('Failed to load accessibility preferences:', err);
      }
    }
    loadPrefs();
  }, []);

  // ── Listen to System Reduced Motion ─────────────────────────
  useEffect(() => {
    let isMounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) setSystemReduceMotion(enabled);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setSystemReduceMotion(enabled);
      }
    );

    return () => {
      isMounted = false;
      subscription?.remove?.();
    };
  }, []);

  // ── Compute Derived Properties ──────────────────────────────
  const isDark = useMemo(() => {
    if (preferences.themeMode === 'dark') return true;
    if (preferences.themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [preferences.themeMode, systemScheme]);

  const isReducedMotionActive = useMemo(() => {
    if (typeof preferences.reducedMotion === 'boolean') {
      return preferences.reducedMotion;
    }
    return systemReduceMotion;
  }, [preferences.reducedMotion, systemReduceMotion]);

  const colors = useMemo(() => {
    return getPalette(isDark, preferences.isHighContrast, preferences.colorBlindMode);
  }, [isDark, preferences.isHighContrast, preferences.colorBlindMode]);

  const fontFamily = useMemo(() => {
    if (preferences.isDyslexicFont) {
      return Fonts?.dyslexic || 'OpenDyslexic';
    }
    return undefined;
  }, [preferences.isDyslexicFont]);

  // ── Update Helper ───────────────────────────────────────────
  const updatePreferences = useCallback(
    async (patch: Partial<AccessibilityPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
          console.warn('Failed to save accessibility preferences:', err)
        );
        return next;
      });
    },
    []
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => updatePreferences({ themeMode: mode }),
    [updatePreferences]
  );
  const setIsHighContrast = useCallback(
    (val: boolean) => updatePreferences({ isHighContrast: val }),
    [updatePreferences]
  );
  const setIsDyslexicFont = useCallback(
    (val: boolean) => updatePreferences({ isDyslexicFont: val }),
    [updatePreferences]
  );
  const setReducedMotion = useCallback(
    (val: boolean | 'system') => updatePreferences({ reducedMotion: val }),
    [updatePreferences]
  );
  const setColorBlindMode = useCallback(
    (val: ColorBlindMode) => updatePreferences({ colorBlindMode: val }),
    [updatePreferences]
  );
  const resetToDefaults = useCallback(
    () => updatePreferences(DEFAULT_ACCESSIBILITY_PREFS),
    [updatePreferences]
  );

  const contextValue = useMemo<AccessibilityContextValue>(
    () => ({
      preferences,
      themeMode: preferences.themeMode,
      isHighContrast: preferences.isHighContrast,
      isDyslexicFont: preferences.isDyslexicFont,
      reducedMotion: preferences.reducedMotion,
      colorBlindMode: preferences.colorBlindMode,
      isDark,
      isReducedMotionActive,
      colors,
      fontFamily,
      updatePreferences,
      setThemeMode,
      setIsHighContrast,
      setIsDyslexicFont,
      setReducedMotion,
      setColorBlindMode,
      resetToDefaults,
    }),
    [
      preferences,
      isDark,
      isReducedMotionActive,
      colors,
      fontFamily,
      updatePreferences,
      setThemeMode,
      setIsHighContrast,
      setIsDyslexicFont,
      setReducedMotion,
      setColorBlindMode,
      resetToDefaults,
    ]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
