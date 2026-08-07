import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';
import { SymbolView } from 'expo-symbols';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface SkillNode {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'locked';
  x: number; // relative coordinate percentage (0-100) or absolute px
  y: number;
}

interface SkillPathsProps {
  nodes: SkillNode[];
  onNodePress?: (node: SkillNode) => void;
  width?: number;
  height?: number;
}

export function SkillNodeItem({
  node,
  onPress,
}: {
  node: SkillNode;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    // Duolingo spring effect
    scale.value = withSpring(1.0, {
      stiffness: theme.animation.customEase ? 300 : 300,
      damping: 15,
    });
  };

  const isCompleted = node.status === 'completed';
  const isActive = node.status === 'active';
  const isLocked = node.status === 'locked';

  const nodeColor = isActive
    ? theme.colors.primary
    : isCompleted
    ? theme.colors.success
    : theme.colors.cardBorder;

  return (
    <View style={[styles.nodeWrapper, { left: node.x - 40, top: node.y - 40 }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={isLocked}
      >
        <Animated.View
          style={[
            styles.nodeCircle,
            {
              backgroundColor: isLocked ? theme.colors.card : nodeColor,
              borderColor: isActive ? '#60A5FA' : nodeColor,
              shadowColor: nodeColor,
            },
            animatedStyle,
          ]}
        >
          {isCompleted && (
            <SymbolView name="checkmark.circle.fill" tintColor="#FFF" size={24} />
          )}
          {isActive && (
            <SymbolView name="star.fill" tintColor="#FFF" size={26} />
          )}
          {isLocked && (
            <SymbolView name="lock.fill" tintColor={theme.colors.textMuted} size={22} />
          )}
        </Animated.View>
      </Pressable>
      <Text
        style={[
          styles.nodeTitle,
          { color: isLocked ? theme.colors.textMuted : theme.colors.text },
        ]}
      >
        {node.title}
      </Text>
    </View>
  );
}

export function SkillPaths({
  nodes,
  onNodePress,
  width = 340,
  height = 420,
}: SkillPathsProps) {
  const pathProgress = useSharedValue(0);

  useEffect(() => {
    // 800ms smooth path drawing animation when unlocked
    pathProgress.value = 0;
    pathProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    });
  }, [nodes]);

  // Construct SVG path string connecting nodes
  const d = nodes.reduce((acc, node, index) => {
    if (index === 0) return `M ${node.x} ${node.y}`;
    const prev = nodes[index - 1];
    // Smooth cubic bezier curve between points
    const controlY = (prev.y + node.y) / 2;
    return `${acc} C ${prev.x} ${controlY}, ${node.x} ${controlY}, ${node.x} ${node.y}`;
  }, '');

  const PATH_LENGTH = 1000;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = PATH_LENGTH * (1 - pathProgress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {/* Background track line */}
        <Path
          d={d}
          stroke={theme.colors.cardBorder}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
        />
        {/* Animated draw path line */}
        <AnimatedPath
          d={d}
          stroke={theme.colors.primary}
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={PATH_LENGTH}
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Render Node Overlay */}
      {nodes.map((node) => (
        <SkillNodeItem
          key={node.id}
          node={node}
          onPress={() => onNodePress?.(node)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 20,
    alignSelf: 'center',
  },
  nodeWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
  },
  nodeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  nodeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
});
