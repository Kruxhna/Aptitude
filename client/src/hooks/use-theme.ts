import { useAccessibility } from '../services/AccessibilityProvider';
import { Colors, ThemeColors } from '../constants/theme';
import { useColorScheme } from './use-color-scheme';

/**
 * Returns dynamic theme colors reflecting user theme mode (Light/Dark/System),
 * High Contrast Mode, and Color-Blindness presets.
 */
export function useTheme(): ThemeColors {
  try {
    const { colors } = useAccessibility();
    return colors;
  } catch {
    const scheme = useColorScheme();
    const theme = scheme === 'dark' ? 'dark' : 'light';
    return Colors[theme];
  }
}
