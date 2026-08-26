import React from 'react';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, ThemeColors } from '../constants/theme';
import { useAccessibility } from '../services/AccessibilityProvider';
import { useTheme } from '../hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'caption'
    | 'badge';
  themeColor?: keyof ThemeColors;
  weight?: 'normal' | '500' | '600' | '700' | '800' | '900' | 'bold';
};

export function ThemedText({
  style,
  type = 'default',
  themeColor,
  weight,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();
  let isDyslexic = false;

  try {
    const acc = useAccessibility();
    isDyslexic = acc.isDyslexicFont;
  } catch {
    // Outside accessibility provider
  }

  const textColor = themeColor ? theme[themeColor] : theme.text;

  // Dyslexia-friendly typographic adjustments: wider letterSpacing and taller lineHeights
  const dyslexicStyle = isDyslexic
    ? {
        fontFamily: Fonts?.dyslexic || 'OpenDyslexic',
        letterSpacing: 0.75,
        lineHeight:
          type === 'title'
            ? 56
            : type === 'subtitle'
            ? 46
            : type === 'default'
            ? 28
            : type === 'small' || type === 'smallBold'
            ? 22
            : 24,
      }
    : undefined;

  return (
    <Text
      style={[
        { color: textColor },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'caption' && styles.caption,
        type === 'badge' && styles.badge,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.linkPrimary, { color: theme.primary }],
        type === 'code' && styles.code,
        weight ? { fontWeight: weight as any } : undefined,
        dyslexicStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  badge: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  link: {
    lineHeight: 24,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  linkPrimary: {
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '700',
  },
  code: {
    fontFamily: Fonts?.mono || 'monospace',
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});
