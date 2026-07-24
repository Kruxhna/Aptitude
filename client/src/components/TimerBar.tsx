import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

interface TimerBarProps {
  durationSeconds: number;
  onTimeOut: () => void;
  isActive: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  durationSeconds,
  onTimeOut,
  isActive,
}) => {
  const animValue = useRef(new Animated.Value(1)).current;
  const isWarning = useRef(false);

  useEffect(() => {
    if (!isActive) return;

    animValue.setValue(1);
    const durationMs = durationSeconds * 1000;

    const anim = Animated.timing(animValue, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: false,
    });

    const listenerId = animValue.addListener(({ value }) => {
      if (value <= 0.25 && !isWarning.current) {
        isWarning.current = true;
      }
    });

    anim.start(({ finished }) => {
      if (finished) {
        onTimeOut();
      }
    });

    return () => {
      anim.stop();
      animValue.removeListener(listenerId);
    };
  }, [durationSeconds, isActive]);

  const widthPercent = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const barColor = animValue.interpolate({
    inputRange: [0, 0.25, 0.26, 1],
    outputRange: [
      colors.danger,
      colors.danger,
      colors.timerNormal,
      colors.timerNormal,
    ],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: widthPercent,
            backgroundColor: barColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 12,
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
