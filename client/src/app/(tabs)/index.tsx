import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, duo } from '../../theme';
import { SpriteAnimator } from '../../components/SpriteAnimator';

// ─── GATE Aptitude Skill Path Nodes ──────────────────────────
const SKILL_NODES = [
  {
    id: 'node-1',
    title: 'Algebra & Ratios',
    category: 'QUANTITATIVE',
    color: '#FF4B4B',
    darkColor: '#EA2B2B',
    status: 'completed' as const,
    offsetX: 0,
  },
  {
    id: 'node-2',
    title: 'Data Interpretation',
    category: 'ANALYTICAL',
    color: '#1CB0F6',
    darkColor: '#1899D6',
    status: 'completed' as const,
    offsetX: 50,
  },
  {
    id: 'node-3',
    title: 'Spatial Transforms',
    category: 'SPATIAL',
    color: '#FFC800',
    darkColor: '#E5B300',
    status: 'active' as const,
    offsetX: 0,
  },
  {
    id: 'node-4',
    title: 'Deductive Logic',
    category: 'LOGICAL',
    color: '#CE82FF',
    darkColor: '#A855F7',
    status: 'locked' as const,
    offsetX: -50,
  },
  {
    id: 'node-5',
    title: 'Verbal Grammar',
    category: 'VERBAL',
    color: '#58CC02',
    darkColor: '#58A700',
    status: 'locked' as const,
    offsetX: 0,
  },
  {
    id: 'node-6',
    title: 'Probability & Stats',
    category: 'QUANTITATIVE',
    color: '#FF9600',
    darkColor: '#CD7900',
    status: 'locked' as const,
    offsetX: 50,
  },
];

// ─── 3D Chunky Circle Button (Duolingo's Signature) ──────────
function ChunkyNode({
  node,
  onPress,
}: {
  node: (typeof SKILL_NODES)[0];
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const isLocked = node.status === 'locked';
  const isActive = node.status === 'active';
  const isCompleted = node.status === 'completed';

  const bgColor = isLocked ? '#E5E5E5' : node.color;
  const shadowColor = isLocked ? '#AFAFAF' : node.darkColor;

  return (
    <View style={[styles.nodeWrapper, { transform: [{ translateX: node.offsetX }] }]}>
      {/* "START" tooltip for active node */}
      {isActive && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>START</Text>
          <View style={styles.tooltipArrow} />
        </View>
      )}

      {/* Glowing ring for active */}
      <View
        style={[
          styles.outerRing,
          isActive && {
            borderWidth: 4,
            borderColor: node.color,
            backgroundColor: `${node.color}22`,
          },
        ]}
      >
        <Pressable
          onPressIn={() => !isLocked && setPressed(true)}
          onPressOut={() => {
            setPressed(false);
            if (!isLocked) onPress();
          }}
          disabled={isLocked}
          style={[
            styles.chunkyCircle,
            {
              backgroundColor: bgColor,
              borderBottomColor: shadowColor,
              borderBottomWidth: pressed ? 1 : 6,
              marginTop: pressed ? 5 : 0,
              opacity: isLocked ? 0.6 : 1,
            },
          ]}
        >
          {isCompleted ? (
            <Text style={styles.nodeIcon}>✓</Text>
          ) : isLocked ? (
            <Text style={[styles.nodeIcon, { fontSize: 24 }]}>🔒</Text>
          ) : (
            <Text style={styles.nodeIcon}>⭐</Text>
          )}
        </Pressable>
      </View>

      {/* Label */}
      <Text style={[styles.nodeTitle, isLocked && styles.nodeTitleLocked]}>
        {node.title}
      </Text>
      <Text style={[styles.nodeCategory, isLocked && styles.nodeTitleLocked]}>
        {node.category}
      </Text>
    </View>
  );
}

// ─── Home Screen ─────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* ─── Top Stat Header ─── */}
      <View style={styles.topBar}>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={[styles.statNum, { color: '#FF9600' }]}>5</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={[styles.statNum, { color: '#FFC800' }]}>2,450</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={[styles.statNum, { color: '#1CB0F6' }]}>1420</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Mascot + Speech Bubble ─── */}
        <View style={styles.mascotRow}>
          <SpriteAnimator
            source={require('../../../assets/sprites/sprinty_idle_hover_sprite.png')}
            style={styles.mascotImg}
            frameCount={4}
            fps={8}
          />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>
              Ready for today's{'\n'}GATE sprint?
            </Text>
            <View style={styles.speechArrow} />
          </View>
        </View>

        {/* ─── Daily Sprint CTA (3D chunky button) ─── */}
        <View style={styles.sprintCard}>
          <View style={styles.sprintRow}>
            <View>
              <Text style={styles.sprintTag}>DAILY SPRINT</Text>
              <Text style={styles.sprintTitle}>Personalized Practice</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.progressLabel}>60% complete · 36/60 XP today</Text>

          {/* 3D Start Button */}
          <TouchableOpacity
            style={styles.startBtn}
            activeOpacity={0.9}
            onPress={() => router.push('/sprint/standard' as any)}
          >
            <View style={styles.startBtnInner}>
              <Text style={styles.startBtnText}>START SPRINT</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Section: Learning Path ─── */}
        <Text style={styles.sectionHeader}>LEARNING PATH</Text>

        {/* ─── Zig-Zag Skill Path ─── */}
        <View style={styles.pathContainer}>
          {/* Vertical connector track */}
          <View style={styles.verticalTrack} />

          {SKILL_NODES.map((node) => (
            <ChunkyNode
              key={node.id}
              node={node}
              onPress={() => router.push('/sprint/standard' as any)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBorder,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 18,
  },
  statNum: {
    fontSize: 17,
    fontWeight: '700',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // ── Mascot + Speech Bubble ──
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  mascotImg: {
    width: 80,
    height: 80,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: duo.radiusCard,
    padding: 14,
    marginLeft: 12,
    flex: 1,
    position: 'relative',
  },
  speechText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 22,
  },
  speechArrow: {
    position: 'absolute',
    left: -8,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.cardBorder,
  },

  // ── Sprint Card ──
  sprintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: duo.radiusCard,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: duo.depthCard + 2,
    borderBottomColor: '#D5D5D5',
    padding: 20,
    marginBottom: 28,
  },
  sprintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sprintTag: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  sprintTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  progressTrack: {
    height: 16,
    backgroundColor: colors.cardBorder,
    borderRadius: duo.radiusProgress,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.duoGold,
    borderRadius: duo.radiusProgress,
  },
  progressLabel: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 16,
  },
  startBtn: {
    borderRadius: duo.radiusButton,
    overflow: 'hidden',
  },
  startBtnInner: {
    backgroundColor: colors.duoGreen,
    paddingVertical: 14,
    borderRadius: duo.radiusButton,
    alignItems: 'center',
    borderBottomWidth: duo.depthButton,
    borderBottomColor: colors.duoGreenDark,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Section Header ──
  sectionHeader: {
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 24,
    textAlign: 'center',
  },

  // ── Zig-Zag Path ──
  pathContainer: {
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 10,
  },
  verticalTrack: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    width: 8,
    backgroundColor: colors.cardBorder,
    borderRadius: 4,
  },

  // ── Node ──
  nodeWrapper: {
    alignItems: 'center',
    marginVertical: 14,
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    top: -34,
    backgroundColor: colors.duoGreen,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: duo.radiusCard,
    zIndex: 10,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: duo.fontSmall,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.duoGreen,
  },
  outerRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chunkyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 6,
  },
  nodeIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nodeTitle: {
    marginTop: 6,
    fontSize: duo.fontCaption,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  nodeCategory: {
    fontSize: duo.fontSmall,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  nodeTitleLocked: {
    color: colors.textMuted,
  },
});
