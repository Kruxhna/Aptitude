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
