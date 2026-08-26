import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { PathNode, SkillCategory } from '../api';
import { colors, duo, SPRING } from '../theme';
import haptics from '../services/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NodePreviewTooltipProps {
  node: PathNode | null;
  anchorLayout: { x: number; y: number; width: number; height: number; pageX: number; pageY: number } | null;
  visible: boolean;
  onDismiss: () => void;
  onStartSprint: (node: PathNode) => void;
}

const SKILL_ICONS: Record<SkillCategory, { icon: string; color: string; bg: string }> = {
  QUANTITATIVE: { icon: '⚡', color: '#FF4B4B', bg: '#FFDFE0' },
  VERBAL: { icon: '📖', color: '#CE82FF', bg: '#F3E8FF' },
  LOGICAL: { icon: '🧠', color: '#1CB0F6', bg: '#DDF4FF' },
  SPATIAL: { icon: '📐', color: '#FFC800', bg: '#FFF4CC' },
};

export function NodePreviewTooltip({
  node,
  anchorLayout,
  visible,
  onDismiss,
  onStartSprint,
}: NodePreviewTooltipProps) {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && node) {
      scale.value = withSpring(1.0, { damping: 14, stiffness: 220 });
      opacity.value = withTiming(1.0, { duration: 180 });
      haptics.modalOpen();
    } else {
      scale.value = 0.85;
      opacity.value = 0;
    }
  }, [visible, node]);

  if (!visible || !node) {
    return null;
  }

  const skillInfo = SKILL_ICONS[node.skill] || SKILL_ICONS.QUANTITATIVE;
  const isLocked = node.state === 'LOCKED';
  const isReview = node.state === 'REVIEW';
  const isPerfect = node.state === 'PERFECT';
  const isCompleted = node.state === 'COMPLETED';
  const isCurrent = node.state === 'CURRENT';

  // Calculate modal card position relative to anchor
  const cardWidth = Math.min(SCREEN_WIDTH - 40, 340);
  let cardTop = SCREEN_HEIGHT / 2 - 130;

  if (anchorLayout) {
    // If node is in upper half of screen, position below it; if lower half, position above it
    if (anchorLayout.pageY < SCREEN_HEIGHT * 0.55) {
      cardTop = Math.min(anchorLayout.pageY + anchorLayout.height + 15, SCREEN_HEIGHT - 280);
    } else {
      cardTop = Math.max(anchorLayout.pageY - 260, 80);
    }
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleCTA = () => {
    if (isLocked) {
      haptics.error();
      return;
    }
    haptics.buttonPress();
    onDismiss();
    onStartSprint(node);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.card,
            {
              width: cardWidth,
              top: cardTop,
              left: (SCREEN_WIDTH - cardWidth) / 2,
            },
            animStyle,
          ]}
        >
          {/* ── Header Skill Badge ── */}
          <View style={styles.headerRow}>
            <View style={[styles.skillBadge, { backgroundColor: skillInfo.bg }]}>
              <Text style={styles.skillIcon}>{skillInfo.icon}</Text>
              <Text style={[styles.skillText, { color: skillInfo.color }]}>
                {node.skill}
              </Text>
            </View>

            {/* State pill */}
            {isPerfect && (
              <View style={[styles.statePill, { backgroundColor: '#FFF9C4', borderColor: '#FFD700' }]}>
                <Text style={styles.statePillText}>★ PERFECT</Text>
              </View>
            )}
            {isReview && (
              <View style={[styles.statePill, { backgroundColor: '#FFE0B2', borderColor: '#FF9800' }]}>
                <Text style={[styles.statePillText, { color: '#E65100' }]}>⚠️ DECAY</Text>
              </View>
            )}
            {isCompleted && !isPerfect && (
              <View style={[styles.statePill, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                <Text style={[styles.statePillText, { color: '#2E7D32' }]}>✓ COMPLETED</Text>
              </View>
            )}
            {isLocked && (
              <View style={[styles.statePill, { backgroundColor: '#F5F5F5', borderColor: '#BDBDBD' }]}>
                <Text style={[styles.statePillText, { color: '#757575' }]}>🔒 LOCKED</Text>
              </View>
            )}
          </View>

          {/* ── Topic Title & Description ── */}
          <Text style={styles.topicTitle}>{node.topic}</Text>
          {node.description ? (
            <Text style={styles.topicDescription}>{node.description}</Text>
          ) : null}

          {/* ── Metadata Row ── */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📝</Text>
              <Text style={styles.metaText}>{node.questionCount} questions</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱️</Text>
              <Text style={styles.metaText}>~{node.estimatedMinutes} min</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⚡</Text>
              <Text style={styles.metaText}>+{node.xpReward || 35} XP</Text>
            </View>
          </View>

          {/* ── Accuracy & Status Note ── */}
          {node.accuracy !== null && node.accuracy !== undefined && !isLocked && (
            <View style={styles.accuracyBanner}>
              <Text style={styles.accuracyText}>
                Best Accuracy: <Text style={styles.accuracyValue}>{Math.round(node.accuracy * 100)}%</Text>
              </Text>
            </View>
          )}

          {isLocked && (
            <View style={styles.lockedWarning}>
              <Text style={styles.lockedWarningText}>
                Complete previous lessons on the path to unlock this topic.
              </Text>
            </View>
          )}

          {/* ── 3D Chunky Action Button ── */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              isLocked
                ? styles.actionButtonLocked
                : isReview
                ? styles.actionButtonReview
                : styles.actionButtonActive,
            ]}
            activeOpacity={isLocked ? 1 : 0.85}
            onPress={handleCTA}
            disabled={isLocked}
          >
            <Text style={[styles.actionButtonText, isLocked && styles.actionButtonTextLocked]}>
              {isLocked
                ? 'LOCKED'
                : isCurrent
                ? 'START SPRINT 🚀'
                : isReview
                ? 'REFRESH SKILL ⚡'
                : 'PRACTICE AGAIN 🔄'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  card: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 5,
    borderBottomColor: '#D0D0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  skillIcon: {
    fontSize: 13,
  },
  skillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statePill: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F57F17',
    letterSpacing: 0.5,
  },
  topicTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 6,
  },
  topicDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 13,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  metaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E0E0E0',
  },
  accuracyBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  accuracyValue: {
    fontWeight: '800',
  },
  lockedWarning: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 8,
    marginBottom: 14,
  },
  lockedWarningText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── 3D Buttons ──
  actionButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },
  actionButtonActive: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primaryDark,
  },
  actionButtonReview: {
    backgroundColor: '#FF9800',
    borderBottomColor: '#E65100',
  },
  actionButtonLocked: {
    backgroundColor: '#E0E0E0',
    borderBottomColor: '#BDBDBD',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  actionButtonTextLocked: {
    color: '#9E9E9E',
  },
});
