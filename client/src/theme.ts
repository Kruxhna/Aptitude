import designTokens from '../theme';

export const colors = {
  backgroundLight: '#EDF2F7',
  background: '#EDF2F7', // Light clean theme matching mobile UI reference
  card: '#FFFFFF',
  cardLight: '#FFFFFF',
  cardBorder: '#E2E8F0',
  border: '#E2E8F0',
  text: '#1E293B',
  textMuted: '#64748B',
  primary: '#00C4B4', // Vibrant Cyan/Teal
  accent: '#00C4B4',
  accentTeal: '#00C4B4',
  success: '#10B981',
  error: '#EF4444',
  danger: '#EF4444',
  warning: '#F59E0B',
  backgroundElement: '#F1F5F9',
  backgroundSelected: '#E2E8F0',
};

export const shapes = {
  borderRadius: 20, // Global 20px border radius token
};

export const animation = {
  customEase: designTokens.ANIMATION_CURVE.customEase,
  cubicBezierValues: designTokens.ANIMATION_CURVE.cubicBezierValues,
};

export const sprites = designTokens.SPRITE_SHEETS;

export const theme = {
  colors,
  shapes,
  animation,
  sprites,
  skillGradients: {
    dataStructures: ['#EC4899', '#D946EF'] as const,
    systemDesign: ['#3B82F6', '#2563EB'] as const,
    networkSecurity: ['#8B5CF6', '#6D28D9'] as const,
    operatingSystems: ['#00C4B4', '#0D9488'] as const,
  }
};

export default theme;

// ─── Component-level convenience exports ─────────────────────────────────────
// Imported directly by components that need only a subset of tokens.

/** Short-form color aliases used by new Learn-mode components. */
export const COLORS = {
  primary: colors.primary,
  success: colors.duoGreen,
  error: colors.duoRed,
  warning: colors.duoGold,

  // Mode identity colors
  learnAccent: '#4CAF50',   // Green — Learn mode
  testAccent: '#FF6B6B',    // Red   — Test mode under pressure

  // Strategy tip
  tipBackground: '#FFF8E1',
  tipAccent: '#FF9800',

  // Hint levels (progressively more revealing)
  hint1: '#E3F2FD',
  hint2: '#BBDEFB',
  hint3: '#64B5F6',

  // Micro-lesson background
  microLesson: '#E8F5E9',
};

/** Shared border-radius values. */
export const RADII = {
  card: duo.radiusCard,        // 12
  button: duo.radiusButton,    // 16
  pill: duo.radiusPill,        // 20
  circle: duo.radiusCircle,    // 999
};

/** Reanimated spring presets. */
export const SPRING = {
  /** Duolingo bounce — signature spring for entrance animations. */
  bounce: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
    overshootClamping: false,
  },
  /** Snappy dismissal. */
  snappy: {
    damping: 20,
    stiffness: 300,
  },
  /** Gentle expand (e.g., expandable cards). */
  gentle: {
    damping: 18,
    stiffness: 200,
  },
};
