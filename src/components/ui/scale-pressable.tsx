import React, { useRef } from 'react';
import { Pressable, PressableProps, Animated, ViewStyle, StyleProp } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  scaleTo?: number;
  opacityTo?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
}

/**
 * Universal tactile pressable button.
 * Delivers immediate visual click feedback (scale + opacity) on touch.
 */
export const ScalePressable: React.FC<ScalePressableProps> = ({
  scaleTo = 0.95,
  opacityTo = 0.8,
  disabled = false,
  onPressIn,
  onPressOut,
  style,
  children,
  ...rest
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: scaleTo,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: opacityTo,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 35,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.5 : opacityAnim,
        },
      ]}>
      {children}
    </AnimatedPressable>
  );
};

