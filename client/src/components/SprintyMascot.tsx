import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { SpriteAnimator } from './SpriteAnimator';
import { MascotEmotion, CostumeId } from '../mascot/types';
import { useMascot } from '../mascot/MascotContext';
import { colors, duo } from '../theme';

const SPRINT_IDLE_SPRITE = require('../../assets/sprites/sprinty_idle_hover_sprite.png');
const SPRINT_JUMP_SPRITE = require('../../assets/sprites/sprinty_correct_jump_sprite.png');

export interface SprintyMascotProps {
  size?: 'sm' | 'md' | 'lg';
  overrideEmotion?: MascotEmotion;
  overrideCostume?: CostumeId;
  showSpeechBubble?: boolean;
  speechText?: string;
  speechHighlight?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SIZE_CONFIG = {
  sm: { width: 48, height: 48, fontSize: 11, bubbleMaxWidth: 140, accessoryScale: 0.6 },
  md: { width: 80, height: 80, fontSize: 13, bubbleMaxWidth: 200, accessoryScale: 1.0 },
  lg: { width: 115, height: 115, fontSize: 15, bubbleMaxWidth: 260, accessoryScale: 1.4 },
};

export function SprintyMascot({
  size = 'md',
  overrideEmotion,
  overrideCostume,
  showSpeechBubble = false,
  speechText,
  speechHighlight,
  onPress,
  style,
}: SprintyMascotProps) {
  const mascotContext = useMascot();
  const currentEmotion = overrideEmotion || mascotContext.emotion || 'IDLE_HOVER';
  const activeCostume = overrideCostume || mascotContext.activeCostume || 'DEFAULT';

  const config = SIZE_CONFIG[size];

  // ─── Animation Values ───────────────────────────────────────────────────────
  const hoverY = useSharedValue(0);
  const wobbleX = useSharedValue(0);
  const headshakeRotate = useSharedValue(0);
  const jumpScale = useSharedValue(1);
  const zzzFloatY = useSharedValue(0);
  const zzzOpacity = useSharedValue(0);
  const sweatDropY = useSharedValue(0);
  const sweatOpacity = useSharedValue(0);

  // ─── Emotion-Driven Animation Controller ────────────────────────────────────
  useEffect(() => {
    // Reset temporary animated transforms
    wobbleX.value = 0;
    headshakeRotate.value = 0;
    jumpScale.value = 1;
    zzzOpacity.value = 0;
    sweatOpacity.value = 0;

    switch (currentEmotion) {
      case 'IDLE_HOVER':
        // Smooth sine bob
        hoverY.value = withRepeat(
          withSequence(
            withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );
        break;

      case 'EXCITED_JUMP':
        // Energetic bounce + scaling
        hoverY.value = withRepeat(
          withSequence(
            withTiming(-20, { duration: 250, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 200, easing: Easing.bounce })
          ),
          4,
          false
        );
        jumpScale.value = withSequence(
          withSpring(1.25, { damping: 6, stiffness: 200 }),
          withTiming(1, { duration: 300 })
        );
        break;

      case 'SAD_HEADSHAKE':
        // Droop down slightly and oscillate left/right headshake
        hoverY.value = withTiming(6, { duration: 300 });
        headshakeRotate.value = withSequence(
          withTiming(-7, { duration: 80 }),
          withTiming(7, { duration: 80 }),
          withTiming(-6, { duration: 80 }),
          withTiming(6, { duration: 80 }),
          withTiming(-4, { duration: 80 }),
          withTiming(4, { duration: 80 }),
          withTiming(0, { duration: 80 })
        );
        break;

      case 'WORRIED_SWEAT':
        // Fast vibration wobble + sweat drop emission
        hoverY.value = withTiming(0, { duration: 200 });
        wobbleX.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 50 }),
            withTiming(3, { duration: 50 })
          ),
          -1,
          true
        );
        sweatOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 200 }),
            withTiming(0, { duration: 600 })
          ),
          -1,
          false
        );
        sweatDropY.value = withRepeat(
          withSequence(
            withTiming(-12, { duration: 0 }),
            withTiming(8, { duration: 800, easing: Easing.out(Easing.quad) })
          ),
          -1,
          false
        );
        break;

      case 'SLEEPING_ZZZ':
        // Subtle slow breathing hover + floating Zzz text
        hoverY.value = withRepeat(
          withSequence(
            withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );
        zzzOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 800 }),
            withTiming(0, { duration: 1200 })
          ),
          -1,
          false
        );
        zzzFloatY.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(-24, { duration: 2000, easing: Easing.out(Easing.quad) })
          ),
          -1,
          false
        );
        break;
    }
  }, [currentEmotion]);

  const mascotAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: hoverY.value },
      { translateX: wobbleX.value },
      { rotateZ: `${headshakeRotate.value}deg` },
      { scale: jumpScale.value },
    ],
    opacity: currentEmotion === 'SLEEPING_ZZZ' ? 0.75 : 1,
  }));

  const sweatAnimStyle = useAnimatedStyle(() => ({
    opacity: sweatOpacity.value,
    transform: [{ translateY: sweatDropY.value }],
  }));

  const zzzAnimStyle = useAnimatedStyle(() => ({
    opacity: zzzOpacity.value,
    transform: [{ translateY: zzzFloatY.value }],
  }));

  // Determine active sprite sheet and animation configuration
  const isJump = currentEmotion === 'EXCITED_JUMP';
  const spriteSource: ImageSourcePropType = isJump ? SPRINT_JUMP_SPRITE : SPRINT_IDLE_SPRITE;
  const frameCount = 4;
  const fps = isJump ? 12 : currentEmotion === 'SLEEPING_ZZZ' ? 4 : 8;

  const handlePress = () => {
    if (currentEmotion === 'SLEEPING_ZZZ') {
      mascotContext.wakeUpMascot();
    } else if (onPress) {
      onPress();
    } else {
      mascotContext.setEmotion('EXCITED_JUMP', 1200);
    }
  };

  return (
    <View style={[styles.rootContainer, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={styles.mascotTouchable}
        accessibilityLabel={`SPRINTY Mascot, Emotion: ${currentEmotion}, Costume: ${activeCostume}`}
      >
        <Animated.View
          style={[
            styles.mascotWrapper,
            { width: config.width, height: config.height },
            mascotAnimStyle,
          ]}
        >
          {/* ── Layer 1: Back Costume (Cape) ── */}
          {activeCostume === 'SUPERHERO_CAPE' && (
            <View
              style={[
                styles.capeLayer,
                {
                  width: config.width * 0.7,
                  height: config.height * 0.8,
                  left: -config.width * 0.1,
                  top: config.height * 0.25,
                },
              ]}
            >
              <Text style={{ fontSize: 24 * config.accessoryScale }}>🦸‍♂️</Text>
            </View>
          )}

          {/* ── Layer 2: Main Sprite Animator ── */}
          <SpriteAnimator
            source={spriteSource}
            frameCount={frameCount}
            fps={fps}
            loop={!isJump}
            style={{ width: config.width, height: config.height }}
          />

          {/* ── Layer 3: Head/Face Costume Accessories ── */}
          {activeCostume === 'GRAD_CAP' && (
            <View style={[styles.headAccessory, { top: -config.height * 0.22 }]}>
              <Text style={{ fontSize: 26 * config.accessoryScale }}>🎓</Text>
            </View>
          )}

          {activeCostume === 'NERD_GLASSES' && (
            <View style={[styles.faceAccessory, { top: config.height * 0.12 }]}>
              <Text style={{ fontSize: 22 * config.accessoryScale }}>👓</Text>
            </View>
          )}

          {activeCostume === 'WIZARD_HAT' && (
            <View style={[styles.headAccessory, { top: -config.height * 0.32 }]}>
              <Text style={{ fontSize: 28 * config.accessoryScale }}>🧙‍♂️</Text>
            </View>
          )}

          {activeCostume === 'ASTRONAUT_HELMET' && (
            <View style={[styles.headAccessory, { top: -config.height * 0.1 }]}>
              <Text style={{ fontSize: 26 * config.accessoryScale }}>🧑‍🚀</Text>
            </View>
          )}

          {/* ── Layer 4: Emotion Overlays (Sweat / Zzz) ── */}
          {currentEmotion === 'WORRIED_SWEAT' && (
            <Animated.View style={[styles.sweatOverlay, sweatAnimStyle]}>
              <Text style={styles.sweatEmoji}>💧</Text>
            </Animated.View>
          )}

          {currentEmotion === 'SLEEPING_ZZZ' && (
            <Animated.View style={[styles.zzzOverlay, zzzAnimStyle]}>
              <View style={styles.zzzBubble}>
                <Text style={styles.zzzText}>Zzz...</Text>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* ── Speech Bubble (Optional) ── */}
      {showSpeechBubble && (speechText || speechHighlight) && (
        <View style={[styles.speechBubble, { maxWidth: config.bubbleMaxWidth }]}>
          <Text style={[styles.speechText, { fontSize: config.fontSize }]}>
            {speechText}
            {speechHighlight ? (
              <Text style={styles.speechHighlight}>
                {speechText ? '\n' : ''}
                {speechHighlight}
              </Text>
            ) : null}
          </Text>
          <View style={styles.speechArrow} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascotTouchable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  // ── Costume Layering ──
  capeLayer: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  headAccessory: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  faceAccessory: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },

  // ── Emotion Overlays ──
  sweatOverlay: {
    position: 'absolute',
    right: -6,
    top: 0,
    zIndex: 20,
  },
  sweatEmoji: {
    fontSize: 18,
  },
  zzzOverlay: {
    position: 'absolute',
    top: -18,
    right: -14,
    zIndex: 20,
  },
  zzzBubble: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
  },
  zzzText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Speech Bubble ──
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderBottomWidth: 4,
    borderBottomColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  speechText: {
    color: colors.textDark,
    lineHeight: 18,
    fontWeight: '600',
  },
  speechHighlight: {
    color: colors.duoGreenDark,
    fontWeight: '800',
  },
  speechArrow: {
    position: 'absolute',
    left: -7,
    top: 14,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderRightWidth: 8,
    borderRightColor: '#FFFFFF',
  },
});
