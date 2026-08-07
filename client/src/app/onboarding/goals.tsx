import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../api';
import { SpriteAnimator } from '../../components/SpriteAnimator';
import { colors, duo } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GoalOption {
  minutes: number;
  label: string;
  description: string;
  xp: number;
  emoji: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  { minutes: 10, label: 'Quick', description: 'A light daily warm-up', xp: 25, emoji: '⚡' },
  { minutes: 20, label: 'Standard', description: 'Balanced daily practice', xp: 50, emoji: '🎯' },
  { minutes: 30, label: 'Deep', description: 'Intensive skill building', xp: 75, emoji: '🔥' },
];

export default function GoalsScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // ── Card scale animations ─────────────────────────────────
  const cardScales = GOAL_OPTIONS.map(() => useSharedValue(1));

  const handleSelectGoal = (index: number) => {
    setSelectedGoal(index);

    // Spring animation on selected card
    cardScales.forEach((scale, i) => {
      if (i === index) {
        scale.value = withSpring(1.0, { stiffness: 300, damping: 15 });
      } else {
        scale.value = withSpring(0.95, { stiffness: 300, damping: 15 });
      }
    });
  };

  const handleContinue = async () => {
    if (selectedGoal === null) return;

    setSaving(true);
    try {
      await api.saveGoal(GOAL_OPTIONS[selectedGoal].minutes);
    } catch (err) {
      console.error('Failed to save goal:', err);
    }
    setSaving(false);

    // Show permission priming modal
    const alreadyPrimed = await AsyncStorage.getItem('notificationPrimed');
    if (!alreadyPrimed) {
      setShowPermissionModal(true);
    } else {
      router.replace('/onboarding/tutorial');
    }
  };

  const handleEnableNotifications = async () => {
    try {
      // We only store the preference for now; actual notification registration
      // happens when expo-notifications is configured in the app config
      await AsyncStorage.setItem('notificationPrimed', 'true');
      await AsyncStorage.setItem('notificationsEnabled', 'true');
    } catch (err) {
      console.error('Failed to save notification preference:', err);
    }
    setShowPermissionModal(false);
    router.replace('/onboarding/tutorial');
  };

  const handleDismissNotifications = async () => {
    await AsyncStorage.setItem('notificationPrimed', 'true');
    setShowPermissionModal(false);
    router.replace('/onboarding/tutorial');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Mascot + Title ── */}
      <View style={styles.heroSection}>
        <SpriteAnimator
          source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
          style={styles.mascot}
          frameCount={4}
          fps={8}
        />
        <Text style={styles.title}>Set your daily goal</Text>
        <Text style={styles.subtitle}>
          How much time do you want to spend each day?
        </Text>
      </View>

      {/* ── Goal Cards ── */}
      <View style={styles.cardsContainer}>
        {GOAL_OPTIONS.map((option, index) => {
          const isSelected = selectedGoal === index;
          const animStyle = useAnimatedStyle(() => ({
            transform: [{ scale: cardScales[index].value }],
          }));

          return (
            <Animated.View key={option.minutes} style={animStyle}>
              <TouchableOpacity
                style={[
                  styles.goalCard,
                  isSelected && styles.goalCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectGoal(index)}
              >
                <Text style={styles.goalEmoji}>{option.emoji}</Text>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                    {option.label}
                  </Text>
                  <Text style={styles.goalDescription}>{option.description}</Text>
                </View>
                <View style={styles.goalMeta}>
                  <Text style={[styles.goalMinutes, isSelected && styles.goalMinutesSelected]}>
                    {option.minutes} min
                  </Text>
                  <Text style={styles.goalXP}>{option.xp} XP/day</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* ── Continue Button ── */}
      {selectedGoal !== null && (
        <Animated.View entering={FadeInDown.duration(300).springify()}>
          <TouchableOpacity
            style={[styles.continueButton, saving && { opacity: 0.6 }]}
            activeOpacity={0.8}
            onPress={handleContinue}
            disabled={saving}
          >
            <Text style={styles.continueButtonText}>
              {saving ? 'SAVING...' : 'CONTINUE'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Permission Priming Modal ── */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="slide"
        onRequestClose={handleDismissNotifications}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <SpriteAnimator
              source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
              style={styles.modalMascot}
              frameCount={4}
              fps={8}
            />
            <Text style={styles.modalTitle}>🎯 Never miss a day!</Text>
            <Text style={styles.modalBody}>
              Get notified for your daily sprint.{'\n'}
              We'll only send 1 notification per day at your preferred time.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryButton}
              activeOpacity={0.8}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.modalPrimaryButtonText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              activeOpacity={0.8}
              onPress={handleDismissNotifications}
            >
              <Text style={styles.modalSecondaryButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  // ── Hero ───────────────────────
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  mascot: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#AFAFAF',
    textAlign: 'center',
  },
  // ── Goal Cards ─────────────────
  cardsContainer: {
    gap: 14,
    flex: 1,
    justifyContent: 'center',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 4,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  goalCardSelected: {
    borderColor: colors.primary || '#00C4B4',
    borderBottomColor: '#0F766E',
    backgroundColor: '#E0FFF9',
  },
  goalEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  goalInfo: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 2,
  },
  goalLabelSelected: {
    color: '#0F766E',
  },
  goalDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#AFAFAF',
  },
  goalMeta: {
    alignItems: 'flex-end',
  },
  goalMinutes: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3C3C3C',
  },
  goalMinutesSelected: {
    color: '#0F766E',
  },
  goalXP: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC800',
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary || '#00C4B4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Continue ───────────────────
  continueButton: {
    backgroundColor: colors.primary || '#00C4B4',
    paddingVertical: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#0F766E',
    alignItems: 'center',
    marginBottom: 32,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  // ── Permission Modal ───────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalMascot: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 15,
    fontWeight: '500',
    color: '#AFAFAF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalPrimaryButton: {
    width: '100%',
    backgroundColor: colors.primary || '#00C4B4',
    paddingVertical: 16,
    borderRadius: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#0F766E',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalSecondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#AFAFAF',
  },
});
