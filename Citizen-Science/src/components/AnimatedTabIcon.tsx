import React, { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface Props { focused: boolean; path: string; size?: number; }
export default function AnimatedTabIcon({ focused, path, size = 24 }: Props) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = withTiming(focused ? 1.3 : 1, { duration: 220 }); }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Svg height={size} width={size} viewBox="0 0 24 24" accessibilityRole="image" accessible>
        <Path fill={focused ? '#007AFF' : '#333'} d={path} />
      </Svg>
    </Animated.View>
  );
}
