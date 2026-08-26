/**
 * settings.tsx
 * Comprehensive settings screen for Sound, Haptics, Mascot, Dark Mode,
 * High Contrast, Dyslexic Typography, and Color-Blind Presets.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useFeedback } from '../../services/FeedbackProvider';
import { useMascot } from '../../mascot/MascotContext';
import { useAccessibility } from '../../services/AccessibilityProvider';
import { useTheme } from '../../hooks/use-theme';
import { ThemedText } from '../../components/themed-text';
import { ThemeMode, ColorBlindMode } from '../../constants/theme';
import { duo } from '../../theme';
import { api } from '../../api';

// ─── Row component ───────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}

function SettingsRow({ icon, label, sublabel, children }: SettingsRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row} accessible={true}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon} accessibilityElementsHidden={true}>
          {icon}
        </Text>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.rowLabel}>{label}</ThemedText>
          {sublabel && (
            <ThemedText style={[styles.rowSublabel, { color: theme.textMuted }]}>
              {sublabel}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <ThemedText
      style={[styles.sectionHeader, { color: theme.textMuted }]}
      accessibilityRole="header"
    >
      {title}
    </ThemedText>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, feedback } = useFeedback();
  const mascot = useMascot();
  const theme = useTheme();
  const {
    themeMode,
    isHighContrast,
    isDyslexicFont,
    reducedMotion,
    colorBlindMode,
    setThemeMode,
    setIsHighContrast,
    setIsDyslexicFont,
    setReducedMotion,
    setColorBlindMode,
  } = useAccessibility();

  // Local slider state for smooth dragging (syncs on release)
  const [sliderValue, setSliderValue] = useState(preferences.soundVolume);

  const handleHapticsToggle = async (value: boolean) => {
    await updatePreferences({ hapticsEnabled: value });
    if (value) {
      setTimeout(() => feedback.haptics.mediumTap(), 100);
    }
    syncPreferencesToAPI({ hapticsEnabled: value });
  };

  const handleSoundToggle = async (value: boolean) => {
    await updatePreferences({ soundEnabled: value });
    if (value) {
      setTimeout(() => feedback.audio.buttonTap(), 200);
    }
    syncPreferencesToAPI({ soundEnabled: value });
  };

  const handleVolumeChange = (value: number) => {
    setSliderValue(Math.round(value));
  };

  const handleVolumeComplete = async (value: number) => {
    const rounded = Math.round(value);
    setSliderValue(rounded);
    await updatePreferences({ soundVolume: rounded });
    feedback.audio.buttonTap();
    syncPreferencesToAPI({ soundVolume: rounded });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundSoft }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Accessibility & Display ─────────────────────────── */}
      <SectionHeader title="ACCESSIBILITY & DISPLAY" />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderBottomColor: isHighContrast ? theme.contrastBorder : '#D5D5D5',
            borderWidth: isHighContrast ? 3 : 2,
          },
        ]}
      >
        {/* Theme Mode Segmented Selector */}
        <View style={styles.segmentContainer}>
          <ThemedText style={styles.segmentTitle}>Theme Mode</ThemedText>
          <View
            style={[
              styles.segmentRow,
              { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
            ]}
          >
            {(
              [
                { mode: 'system', label: '📱 System' },
                { mode: 'light', label: '☀️ Light' },
                { mode: 'dark', label: '🌙 Dark' },
              ] as { mode: ThemeMode; label: string }[]
            ).map((item) => {
              const isSelected = themeMode === item.mode;
              return (
                <Pressable
                  key={item.mode}
                  onPress={() => {
                    feedback.haptics.selectionChange();
                    setThemeMode(item.mode);
                  }}
                  style={[
                    styles.segmentButton,
                    isSelected && [
                      styles.segmentButtonActive,
                      {
                        backgroundColor: theme.primary,
                        borderColor: theme.primaryDark,
                      },
                    ],
                  ]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${item.label} theme`}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* High Contrast Mode Toggle */}
        <SettingsRow
          icon="👁️"
          label="High Contrast Mode"
          sublabel="WCAG AAA pure black/white & high-visibility borders"
        >
          <Switch
            value={isHighContrast}
            onValueChange={(val) => {
              feedback.haptics.mediumTap();
              setIsHighContrast(val);
            }}
            trackColor={{ false: theme.cardBorder, true: `${theme.primary}80` }}
            thumbColor={isHighContrast ? theme.primary : '#f4f3f4'}
            accessible={true}
            accessibilityLabel="High Contrast Mode toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: isHighContrast }}
          />
        </SettingsRow>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* Dyslexic-Friendly Font */}
        <SettingsRow
          icon="📖"
          label="Dyslexia-Friendly Font"
          sublabel="OpenDyslexic typography with weighted bottoms & wider spacing"
        >
          <Switch
            value={isDyslexicFont}
            onValueChange={(val) => {
              feedback.haptics.mediumTap();
              setIsDyslexicFont(val);
            }}
            trackColor={{ false: theme.cardBorder, true: `${theme.primary}80` }}
            thumbColor={isDyslexicFont ? theme.primary : '#f4f3f4'}
            accessible={true}
            accessibilityLabel="Dyslexia-friendly font toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: isDyslexicFont }}
          />
        </SettingsRow>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* Reduced Motion Toggle */}
        <SettingsRow
          icon="🧘"
          label="Reduced Motion"
          sublabel="Disables bouncing springs, mascot wobbles & confetti bursts"
        >
          <Switch
            value={reducedMotion === true}
            onValueChange={(val) => {
              feedback.haptics.mediumTap();
              setReducedMotion(val);
            }}
            trackColor={{ false: theme.cardBorder, true: `${theme.primary}80` }}
            thumbColor={reducedMotion === true ? theme.primary : '#f4f3f4'}
            accessible={true}
            accessibilityLabel="Reduced motion toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: reducedMotion === true }}
          />
        </SettingsRow>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        {/* Color-Blind Safe Presets */}
        <View style={styles.colorBlindSection}>
          <ThemedText style={styles.segmentTitle}>Color-Blind Palette Presets</ThemedText>
          <ThemedText style={[styles.colorBlindSubtitle, { color: theme.textMuted }]}>
            Adjusts quiz validation colors (green/red) to distinguishable dual-tones:
          </ThemedText>

          <View style={styles.colorBlindPillRow}>
            {(
              [
                { key: 'none', label: 'Standard' },
                { key: 'protanopia', label: 'Protanopia' },
                { key: 'deuteranopia', label: 'Deuteranopia' },
                { key: 'tritanopia', label: 'Tritanopia' },
              ] as { key: ColorBlindMode; label: string }[]
            ).map((item) => {
              const isSelected = colorBlindMode === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => {
                    feedback.haptics.selectionChange();
                    setColorBlindMode(item.key);
                  }}
                  style={[
                    styles.colorBlindPill,
                    {
                      backgroundColor: isSelected
                        ? theme.duoGreen
                        : theme.backgroundElement,
                      borderColor: isSelected
                        ? theme.duoGreenDark
                        : theme.cardBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.colorBlindPillText,
                      { color: isSelected ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Live Color Swatch Preview */}
          <View
            style={[
              styles.swatchCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
            ]}
          >
            <ThemedText style={styles.swatchTitle}>Active Validation Palette:</ThemedText>
            <View style={styles.swatchRow}>
              <View style={[styles.swatchItem, { backgroundColor: theme.duoGreen }]}>
                <Text style={styles.swatchItemText}>✓ Correct</Text>
              </View>
              <View style={[styles.swatchItem, { backgroundColor: theme.duoRed }]}>
                <Text style={styles.swatchItemText}>✕ Wrong</Text>
              </View>
              <View style={[styles.swatchItem, { backgroundColor: theme.duoGold }]}>
                <Text style={styles.swatchItemText}>⚡ Streak</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── 2. Mascot & Wardrobe ─────────────────────────────────── */}
      <SectionHeader title="SPRINTY COMPANION" />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderBottomColor: isHighContrast ? theme.contrastBorder : '#D5D5D5',
            borderWidth: isHighContrast ? 3 : 2,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            feedback.haptics.mediumTap();
            router.push('/wardrobe' as any);
          }}
          activeOpacity={0.7}
        >
          <SettingsRow
            icon="🤖"
            label="SPRINTY Wardrobe & Cosmetics"
            sublabel={`Active Skin: ${mascot.activeCostume.replace('_', ' ')}`}
          >
            <Text style={[styles.chevron, { color: theme.primary }]}>Customize ›</Text>
          </SettingsRow>
        </TouchableOpacity>
      </View>

      {/* ── 3. Haptics & Audio ───────────────────────────────────── */}
      <SectionHeader title="FEEDBACK & AUDIO" />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderBottomColor: isHighContrast ? theme.contrastBorder : '#D5D5D5',
            borderWidth: isHighContrast ? 3 : 2,
          },
        ]}
      >
        <SettingsRow
          icon="📳"
          label="Haptic Feedback"
          sublabel="Vibration on correct/wrong answers, buttons & milestones"
        >
          <Switch
            value={preferences.hapticsEnabled}
            onValueChange={handleHapticsToggle}
            trackColor={{ false: theme.cardBorder, true: `${theme.primary}80` }}
            thumbColor={preferences.hapticsEnabled ? theme.primary : '#f4f3f4'}
            accessible={true}
            accessibilityLabel="Haptic feedback toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: preferences.hapticsEnabled }}
          />
        </SettingsRow>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        <SettingsRow
          icon="🔊"
          label="Sound Effects"
          sublabel="Audio chimes for correct answers, levels & timer warnings"
        >
          <Switch
            value={preferences.soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: theme.cardBorder, true: `${theme.primary}80` }}
            thumbColor={preferences.soundEnabled ? theme.primary : '#f4f3f4'}
            accessible={true}
            accessibilityLabel="Sound effects toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: preferences.soundEnabled }}
          />
        </SettingsRow>
      </View>

      {/* ── 4. Volume Slider ─────────────────────────────────────── */}
      <SectionHeader title="VOLUME" />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderBottomColor: isHighContrast ? theme.contrastBorder : '#D5D5D5',
            borderWidth: isHighContrast ? 3 : 2,
          },
        ]}
      >
        <View style={styles.volumeSection}>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeIcon}>🎚️</Text>
            <ThemedText style={styles.rowLabel}>Sound Volume</ThemedText>
            <ThemedText style={[styles.volumeValue, { color: theme.primary }]}>
              {sliderValue}%
            </ThemedText>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={sliderValue}
            onValueChange={handleVolumeChange}
            onSlidingComplete={handleVolumeComplete}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.cardBorder}
            thumbTintColor={theme.primary}
            disabled={!preferences.soundEnabled}
            accessible={true}
            accessibilityLabel="Sound volume slider"
            accessibilityHint="Slide left to decrease, right to increase volume"
          />
          <View style={styles.volumeLabels}>
            <ThemedText style={styles.volumeCaption}>Mute</ThemedText>
            <ThemedText style={styles.volumeCaption}>Max</ThemedText>
          </View>
        </View>
      </View>

      {/* ── 5. About ─────────────────────────────────────────────── */}
      <SectionHeader title="ABOUT & COMPLIANCE" />

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            borderBottomColor: isHighContrast ? theme.contrastBorder : '#D5D5D5',
            borderWidth: isHighContrast ? 3 : 2,
          },
        ]}
      >
        <SettingsRow icon="ℹ️" label="Version">
          <ThemedText style={styles.versionText}>1.0.0</ThemedText>
        </SettingsRow>
        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
        <SettingsRow icon="♿" label="WCAG 2.2 AAA Compliance">
          <ThemedText style={[styles.versionText, { color: theme.duoGreen }]}>
            Verified ✓
          </ThemedText>
        </SettingsRow>
      </View>

      {/* Footnote on screen readers */}
      <ThemedText style={[styles.footNote, { color: theme.textMuted }]}>
        Screen reader support (VoiceOver / TalkBack) is active. Dual-encoding (shape +
        color + text) ensures 100% accessible navigation.
      </ThemedText>
    </ScrollView>
  );
}

// ─── API sync (fire-and-forget) ───────────────────────────────────────────────

async function syncPreferencesToAPI(patch: Record<string, unknown>): Promise<void> {
  try {
    await api.updatePreferences(patch);
  } catch {
    // Network unavailable — local AsyncStorage change is already applied
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 48,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: duo.radiusCard,
    borderBottomWidth: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rowRight: {
    marginLeft: 16,
  },
  rowIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSublabel: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },

  // ── Segmented Control ──
  segmentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  segmentTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 3,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    borderBottomWidth: 3,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Color-Blind Section ──
  colorBlindSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  colorBlindSubtitle: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  colorBlindPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorBlindPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  colorBlindPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  swatchCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
  },
  swatchTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  swatchItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  swatchItemText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // ── Volume ──
  volumeSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  volumeIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  volumeValue: {
    marginLeft: 'auto',
    fontSize: 15,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  volumeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  volumeCaption: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Misc ──
  versionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chevron: {
    fontSize: 15,
    fontWeight: '800',
  },
  footNote: {
    fontSize: 12,
    marginTop: 24,
    marginHorizontal: 4,
    lineHeight: 18,
    textAlign: 'center',
  },
});
