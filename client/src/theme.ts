import designTokens from '../theme';

// ─── Duolingo-Inspired Design Tokens ─────────────────────────
// Extracted from the Duolingo Figma UI Kit, adapted for GATE Aptitude Trainer.

export const colors = {
  // Backgrounds
  background: '#FFFFFF',         // Duolingo uses pure white
  backgroundSoft: '#F7F7F7',     // Subtle gray for sections
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',         // Duolingo border gray
  border: '#E5E5E5',

  // Text
  text: '#3C3C3C',               // Duolingo primary text
  textMuted: '#AFAFAF',          // Duolingo muted text
  textDark: '#4B4B4B',           // Duolingo secondary text

  // Brand / Primary
  primary: '#00C4B4',            // GATE Aptitude Teal (brand identity)
  primaryDark: '#0F766E',        // 3D depth for teal buttons
  accent: '#00C4B4',
  accentTeal: '#00C4B4',

  // Duolingo Functional Colors
  duoGreen: '#58CC02',           // Correct answers, success CTA
  duoGreenDark: '#58A700',       // 3D depth for green buttons
  duoGreenLight: '#D7FFB8',      // Correct answer card bg
  duoGold: '#FFC800',            // Progress bars, XP, streaks
  duoGoldDark: '#E5B300',        // 3D depth for gold elements
  duoRed: '#FF4B4B',             // Hearts, errors, wrong answers
  duoRedDark: '#EA2B2B',         // 3D depth for red
  duoRedLight: '#FFDFE0',        // Wrong answer card bg
  duoPurple: '#CE82FF',          // Category tags, skill labels
  duoBlue: '#1CB0F6',            // Active tab, links

  // Legacy aliases (kept for backward compatibility)
  success: '#58CC02',
  error: '#FF4B4B',
  danger: '#FF4B4B',
  warning: '#FFC800',
  backgroundLight: '#F7F7F7',
  cardLight: '#FFFFFF',
  backgroundElement: '#F7F7F7',
  backgroundSelected: '#E5E5E5',
  textPrimary: '#3C3C3C',
};

export const duo = {
  // 3D Depth System — Duolingo's signature chunky button style
  depth: 4,                      // Standard 3D border-bottom width
  depthButton: 5,                // CTA buttons get extra depth
  depthCard: 3,                  // Cards get subtle depth

  // Border Radii — from Figma inspection
  radiusCard: 12,                // Card corners
  radiusButton: 16,              // CTA button corners
  radiusProgress: 8,             // Progress bars
  radiusPill: 20,                // Pill badges, tags
  radiusCircle: 999,             // Fully round

  // Font Weights
  weightBold: '700' as const,
  weightRegular: '500' as const,
  weightBlack: '900' as const,

  // Font Sizes — from Figma
  fontTitle: 22.5,               // Question prompts
  fontBody: 15,                  // Body text, option labels
  fontCaption: 13,               // Category tags, captions
  fontSmall: 11,                 // Badges, timestamps
};

export const shapes = {
  borderRadius: duo.radiusCard,
};

export const animation = {
  customEase: designTokens.ANIMATION_CURVE.customEase,
  cubicBezierValues: designTokens.ANIMATION_CURVE.cubicBezierValues,
  duolingoBounce: designTokens.ANIMATION_CURVE.duolingoBounce,
};

export const sprites = designTokens.SPRITE_SHEETS;

export const theme = {
  colors,
  duo,
  shapes,
  animation,
  sprites,
  skillColors: {
    verbal:       { bg: '#CE82FF', dark: '#A855F7', light: '#F3E8FF' },
    quantitative: { bg: '#FF4B4B', dark: '#EA2B2B', light: '#FFDFE0' },
    logical:      { bg: '#1CB0F6', dark: '#1899D6', light: '#DDF4FF' },
    spatial:      { bg: '#FFC800', dark: '#E5B300', light: '#FFF4CC' },
  },
  skillGradients: {
    verbal: ['#CE82FF', '#A855F7'] as const,
    quantitative: ['#FF4B4B', '#EA2B2B'] as const,
    logical: ['#1CB0F6', '#1899D6'] as const,
    spatial: ['#FFC800', '#E5B300'] as const,
  }
};

export default theme;
