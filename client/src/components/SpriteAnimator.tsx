import React, { useEffect, useState } from 'react';
import { View, ImageSourcePropType, LayoutChangeEvent, Image } from 'react-native';

interface SpriteAnimatorProps {
  source: ImageSourcePropType;
  frameCount: number;
  fps?: number;
  loop?: boolean;
  style?: any;
}

export function SpriteAnimator({
  source,
  frameCount,
  fps = 8,
  loop = true,
  style,
}: SpriteAnimatorProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let currentFrame = 0;
    const interval = setInterval(() => {
      currentFrame++;
      if (currentFrame >= frameCount) {
        if (loop) {
          currentFrame = 0;
        } else {
          currentFrame = frameCount - 1;
          clearInterval(interval);
        }
      }
      setFrameIndex(currentFrame);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frameCount, fps, loop, source]);

  // When source changes, reset to frame 0
  useEffect(() => {
    setFrameIndex(0);
  }, [source]);

  const onLayout = (e: LayoutChangeEvent) => {
    setFrameSize({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  return (
    <View style={[{ overflow: 'hidden' }, style]} onLayout={onLayout}>
      {frameSize.width > 0 && (
        <Image
          source={source}
          style={{
            width: frameSize.width * frameCount,
            height: frameSize.height,
            transform: [{ translateX: -frameIndex * frameSize.width }],
          }}
          resizeMode="stretch"
        />
      )}
    </View>
  );
}
