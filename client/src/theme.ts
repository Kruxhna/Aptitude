export const colors = {
  background: '#0B0F19',
  card: '#151C2C',
  cardBorder: '#1F293D',
  text: '#F3F4F6',
  textMuted: '#9CA3AF',
  accent: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  timerNormal: '#3B82F6',
  timerWarning: '#EF4444',
};

export const skillGradients: Record<string, [string, string]> = {
  verbal: ['#8B5CF6', '#3B82F6'],       // Purple -> Blue
  quantitative: ['#14B8A6', '#10B981'], // Teal -> Green
  logical: ['#F97316', '#F59E0B'],      // Orange -> Amber
  spatial: ['#EC4899', '#EF4444'],      // Pink -> Red
};

export const skillNames: Record<string, string> = {
  verbal: 'Verbal Aptitude',
  quantitative: 'Quantitative Aptitude',
  logical: 'Logical Reasoning',
  spatial: 'Spatial Aptitude',
};
