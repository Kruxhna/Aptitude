import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundSoft: string;
  card: string;
  cardBorder: string;
  border: string;

  // Text
  text: string;
  textMuted: string;
  textDark: string;
  textSecondary: string;

  // Brand / Primary
  primary: string;
  primaryDark: string;
  accent: string;
  accentTeal: string;

  // Status & Functional Colors
  duoGreen: string;
  duoGreenDark: string;
  duoGreenLight: string;
  duoGold: string;
  duoGoldDark: string;
  duoRed: string;
  duoRedDark: string;
  duoRedLight: string;
  duoPurple: string;
  duoBlue: string;

  // High contrast & Dual-encoding accents
  contrastBorder: string;
  contrastHighlight: string;
  statusCorrectText: string;
  statusIncorrectText: string;
  statusNeutralText: string;

  // Background element aliases
  backgroundElement: string;
  backgroundSelected: string;
}

// ─── 1. Standard Light Theme (Duolingo Palette) ──────────────────────────────
export const LightPalette: ThemeColors = {
  background: '#FFFFFF',
  backgroundSoft: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  border: '#E2E8F0',

  text: '#1E293B',
  textMuted: '#64748B',
  textDark: '#0F172A',
  textSecondary: '#475569',

  primary: '#00C4B4',
  primaryDark: '#0F766E',
  accent: '#00C4B4',
  accentTeal: '#00C4B4',

  duoGreen: '#22C55E',
  duoGreenDark: '#15803D',
  duoGreenLight: '#DCFCE7',
  duoGold: '#F59E0B',
  duoGoldDark: '#B45309',
  duoRed: '#EF4444',
  duoRedDark: '#B91C1C',
  duoRedLight: '#FEE2E2',
  duoPurple: '#A855F7',
  duoBlue: '#0284C7',

  contrastBorder: '#CBD5E1',
  contrastHighlight: '#F59E0B',
  statusCorrectText: '#15803D',
  statusIncorrectText: '#B91C1C',
  statusNeutralText: '#0284C7',

  backgroundElement: '#F1F5F9',
  backgroundSelected: '#E2E8F0',
};

// ─── 2. Sleek Dark Theme ─────────────────────────────────────────────────────
export const DarkPalette: ThemeColors = {
  background: '#0F172A',
  backgroundSoft: '#1E293B',
  card: '#1E293B',
  cardBorder: '#334155',
  border: '#334155',

  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDark: '#FFFFFF',
  textSecondary: '#CBD5E1',

  primary: '#14B8A6',
  primaryDark: '#0D9488',
  accent: '#14B8A6',
  accentTeal: '#14B8A6',

  duoGreen: '#22C55E',
  duoGreenDark: '#16A34A',
  duoGreenLight: '#064E3B',
  duoGold: '#F59E0B',
  duoGoldDark: '#D97706',
  duoRed: '#EF4444',
  duoRedDark: '#DC2626',
  duoRedLight: '#7F1D1D',
  duoPurple: '#C084FC',
  duoBlue: '#38BDF8',

  contrastBorder: '#475569',
  contrastHighlight: '#FBBF24',
  statusCorrectText: '#4ADE80',
  statusIncorrectText: '#F87171',
  statusNeutralText: '#38BDF8',

  backgroundElement: '#1E293B',
  backgroundSelected: '#334155',
};

// ─── 3. High Contrast Light (WCAG AAA ≥ 7:1) ─────────────────────────────────
export const HighContrastLightPalette: ThemeColors = {
  background: '#FFFFFF',
  backgroundSoft: '#F0F0F0',
  card: '#FFFFFF',
  cardBorder: '#000000',
  border: '#000000',

  text: '#000000',
  textMuted: '#1A1A1A',
  textDark: '#000000',
  textSecondary: '#000000',

  primary: '#005F56',
  primaryDark: '#00332E',
  accent: '#005F56',
  accentTeal: '#005F56',

  duoGreen: '#007A00',
  duoGreenDark: '#004D00',
  duoGreenLight: '#D0F0C0',
  duoGold: '#8C5E00',
  duoGoldDark: '#5E3F00',
  duoRed: '#B30000',
  duoRedDark: '#800000',
  duoRedLight: '#FFCCCC',
  duoPurple: '#6A00A8',
  duoBlue: '#0040C0',

  contrastBorder: '#000000',
  contrastHighlight: '#D48800',
  statusCorrectText: '#004D00',
  statusIncorrectText: '#800000',
  statusNeutralText: '#003399',

  backgroundElement: '#E6E6E6',
  backgroundSelected: '#CCCCCC',
};

// ─── 4. High Contrast Dark (WCAG AAA ≥ 7:1 with Pure Black & Neon Yellow) ────
export const HighContrastDarkPalette: ThemeColors = {
  background: '#000000',
  backgroundSoft: '#121212',
  card: '#0A0A0A',
  cardBorder: '#FFD700',
  border: '#FFD700',

  text: '#FFFFFF',
  textMuted: '#E0E0E0',
  textDark: '#FFFFFF',
  textSecondary: '#FFFFFF',

  primary: '#00FFE0',
  primaryDark: '#00CCB4',
  accent: '#00FFE0',
  accentTeal: '#00FFE0',

  duoGreen: '#00FF66',
  duoGreenDark: '#00CC52',
  duoGreenLight: '#003314',
  duoGold: '#FFD700',
  duoGoldDark: '#CCAC00',
  duoRed: '#FF3344',
  duoRedDark: '#CC1122',
  duoRedLight: '#4D0008',
  duoPurple: '#E066FF',
  duoBlue: '#00E5FF',

  contrastBorder: '#FFD700',
  contrastHighlight: '#FFD700',
  statusCorrectText: '#00FF66',
  statusIncorrectText: '#FF3344',
  statusNeutralText: '#00E5FF',

  backgroundElement: '#1A1A1A',
  backgroundSelected: '#333333',
};

/**
 * Returns color palette tailored for theme mode, high contrast, and color-blindness.
 */
export function getPalette(
  isDark: boolean,
  isHighContrast: boolean,
  colorBlindMode: ColorBlindMode = 'none'
): ThemeColors {
  let base: ThemeColors;

  if (isHighContrast) {
    base = isDark ? { ...HighContrastDarkPalette } : { ...HighContrastLightPalette };
  } else {
    base = isDark ? { ...DarkPalette } : { ...LightPalette };
  }

  // ── Color-Blind Safe Adjustments ─────────────────────────────
  if (colorBlindMode === 'protanopia') {
    // Red-weak: Shift red to deep vermilion/magenta & green to bright cyan/blue
    base.duoGreen = '#0099FF';
    base.duoGreenDark = '#0066CC';
    base.duoGreenLight = isDark ? '#002244' : '#DDF0FF';
    base.duoRed = '#D95F02'; // Vermilion orange
    base.duoRedDark = '#A33C00';
    base.duoRedLight = isDark ? '#4D1D00' : '#FFE8D6';
    base.statusCorrectText = '#0066CC';
    base.statusIncorrectText = '#A33C00';
  } else if (colorBlindMode === 'deuteranopia') {
    // Green-weak: Use blue for positive/correct and amber/yellow-orange for negative/incorrect
    base.duoGreen = '#1E88E5'; // Vivid Blue
    base.duoGreenDark = '#1565C0';
    base.duoGreenLight = isDark ? '#0D47A1' : '#E3F2FD';
    base.duoRed = '#FB8C00'; // Dark Amber
    base.duoRedDark = '#EF6C00';
    base.duoRedLight = isDark ? '#E65100' : '#FFF3E0';
    base.statusCorrectText = '#1565C0';
    base.statusIncorrectText = '#EF6C00';
  } else if (colorBlindMode === 'tritanopia') {
    // Blue-weak: Use teal/cyan for correct and magenta/ruby for incorrect
    base.duoGreen = '#00B4D8';
    base.duoGreenDark = '#0077B6';
    base.duoGreenLight = isDark ? '#03045E' : '#E0FAFF';
    base.duoRed = '#E63946'; // Vivid Crimson
    base.duoRedDark = '#9B111E';
    base.duoRedLight = isDark ? '#4A080E' : '#FFEBEB';
    base.statusCorrectText = '#0077B6';
    base.statusIncorrectText = '#9B111E';
  }

  return base;
}

// ── Backward-compatible legacy exports ───────────────────────────────────────
export const Colors = {
  light: LightPalette,
  dark: DarkPalette,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
    dyslexic: 'OpenDyslexic',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    dyslexic: 'OpenDyslexic',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
    dyslexic: 'OpenDyslexic, sans-serif',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
