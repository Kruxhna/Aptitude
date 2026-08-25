/**
 * settings.tsx
 * User preferences screen for haptics, audio, and accessibility.
 *
 * Features:
 *   - Toggle haptic feedback on/off
 *   - Toggle sound effects on/off
 *   - Volume slider (0–100%)
 *   - Live preview: tap/play a sample when adjusting
 *   - Persists via AsyncStorage (instant) + syncs to API (background)
 *   - Duolingo 3D toggle switches with brand colors
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { useFeedback } from '../../services/FeedbackProvider';
import { useMascot } from '../../mascot/MascotContext';
import { colors, duo } from '../../theme';
import { api } from '../../api';

// ─── Row components ───────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}

function SettingsRow({ icon, label, sublabel, children }: SettingsRowProps) {
  return (
    <View style={styles.row} accessible={true}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon} accessibilityElementsHidden={true}>{icon}</Text>
        <View>
          <Text style={styles.rowLabel}>{label}</Text>
          {sublabel && (
            <Text style={styles.rowSublabel}>{sublabel}</Text>
          )}
        </View>
      </View>
      <View style={styles.rowRight}>{children}</View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader} accessibilityRole="header">{title}</Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, feedback } = useFeedback();
  const mascot = useMascot();

  // Local slider state for smooth dragging (syncs on release)
  const [sliderValue, setSliderValue] = useState(preferences.soundVolume);

  const handleHapticsToggle = async (value: boolean) => {
    await updatePreferences({ hapticsEnabled: value });
    // Give a sample tap if enabling
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
    // Play a preview at the new volume
    feedback.audio.buttonTap();
    syncPreferencesToAPI({ soundVolume: rounded });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Mascot & Wardrobe ────────────────────────────────────── */}
      <SectionHeader title="SPRINTY COMPANION" />

      <View style={styles.card}>
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
            <Text style={styles.chevron}>Customize ›</Text>
          </SettingsRow>
        </TouchableOpacity>
      </View>

      {/* ── Haptics ────────────────────────────────────────────────── */}
      <SectionHeader title="FEEDBACK" />

      <View style={styles.card}>
        <SettingsRow
          icon="📳"
          label="Haptic Feedback"
          sublabel="Vibration on correct/wrong answers and taps"
        >
          <Switch
            value={preferences.hapticsEnabled}
            onValueChange={handleHapticsToggle}
            trackColor={{ false: colors.cardBorder, true: `${colors.primary}80` }}
            thumbColor={preferences.hapticsEnabled ? colors.primary : '#f4f3f4'}
            ios_backgroundColor={colors.cardBorder}
            accessible={true}
            accessibilityLabel="Haptic feedback toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: preferences.hapticsEnabled }}
          />
        </SettingsRow>

        <View style={styles.divider} />

        <SettingsRow
          icon="🔊"
          label="Sound Effects"
          sublabel="Audio cues for correct/wrong answers and events"
        >
          <Switch
            value={preferences.soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: colors.cardBorder, true: `${colors.primary}80` }}
            thumbColor={preferences.soundEnabled ? colors.primary : '#f4f3f4'}
            ios_backgroundColor={colors.cardBorder}
            accessible={true}
            accessibilityLabel="Sound effects toggle"
            accessibilityRole="switch"
            accessibilityState={{ checked: preferences.soundEnabled }}
          />
        </SettingsRow>
      </View>

      {/* ── Volume ─────────────────────────────────────────────────── */}
      <SectionHeader title="VOLUME" />

      <View style={styles.card}>
        <View style={styles.volumeSection}>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeIcon}>🎚️</Text>
            <Text style={styles.rowLabel}>Sound Volume</Text>
            <Text style={styles.volumeValue}>{sliderValue}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={sliderValue}
            onValueChange={handleVolumeChange}
            onSlidingComplete={handleVolumeComplete}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.cardBorder}
            thumbTintColor={colors.primary}
            disabled={!preferences.soundEnabled}
            accessible={true}
            accessibilityLabel="Sound volume slider"
            accessibilityHint="Slide left to decrease, right to increase volume"
          />
          <View style={styles.volumeLabels}>
            <Text style={styles.volumeCaption}>Mute</Text>
            <Text style={styles.volumeCaption}>Max</Text>
          </View>
        </View>
      </View>

      {/* ── About ─────────────────────────────────────────────────── */}
      <SectionHeader title="ABOUT" />

      <View style={styles.card}>
        <SettingsRow icon="ℹ️" label="Version">
          <Text style={styles.versionText}>1.0.0</Text>
        </SettingsRow>
        <View style={styles.divider} />
        <SettingsRow icon="📖" label="Open Source Licenses">
          <Text style={styles.chevron}>›</Text>
        </SettingsRow>
      </View>

      {/* Note on device accessibility */}
      <Text style={styles.footNote}>
        Screen reader support (VoiceOver / TalkBack) is controlled by your device's
        Accessibility settings. The app is fully compatible with both.
      </Text>
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
    backgroundColor: colors.backgroundSoft,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#D5D5D5',
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
    fontWeight: '600',
    color: colors.text,
  },
  rowSublabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 220,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginHorizontal: 16,
  },
  // Volume
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
    fontWeight: '700',
    color: colors.primary,
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
    color: colors.textMuted,
    fontWeight: '500',
  },
  // Misc
  versionText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
  },
  footNote: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 24,
    marginHorizontal: 4,
    lineHeight: 18,
    textAlign: 'center',
  },
});
