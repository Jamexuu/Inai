import React, { useRef } from 'react';
import { Pressable, Text, ViewStyle, Animated } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  textClassName?: string;
  numberOfLines?: number;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  className = '',
  textClassName = '',
  numberOfLines = 1,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
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
  };

  const getVariantButtonClass = () => {
    if (disabled) return 'bg-surface border border-subtle-border dark:bg-surface-dark dark:border-subtle-border-dark';
    switch (variant) {
      case 'primary':
        return 'bg-sage active:bg-[#2E443C] dark:bg-sage-dark dark:active:bg-sage';
      case 'secondary':
        return 'bg-terracotta active:bg-[#A85338] dark:bg-terracotta-dark';
      case 'outline':
        return 'bg-card border-[1.5px] border-subtle-border active:bg-surface dark:bg-card-dark dark:border-subtle-border-dark dark:active:bg-surface-dark';
      case 'danger':
        return 'bg-card border-[1.5px] border-brick active:bg-brick-tint dark:bg-card-dark dark:border-brick-dark dark:active:bg-brick-dark-tint';
      case 'ghost':
        return 'bg-transparent active:bg-surface dark:active:bg-surface-dark';
      default:
        return 'bg-sage active:bg-[#2E443C] dark:bg-sage-dark';
    }
  };

  const getVariantTextClass = () => {
    if (disabled) return 'text-umber dark:text-umber-dark';
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white dark:text-[#101F18] font-bold';
      case 'outline':
        return 'text-sage dark:text-sage-dark font-bold';
      case 'danger':
        return 'text-brick dark:text-brick-dark font-bold';
      case 'ghost':
        return 'text-umber dark:text-umber-dark font-semibold';
      default:
        return 'text-white dark:text-[#101F18] font-bold';
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        style,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : opacityAnim,
        },
      ]}
      className={`min-h-[50px] flex-row items-center justify-center px-4 rounded-xl gap-2 ${getVariantButtonClass()} ${className}`}>
      {icon}
      <Text
        numberOfLines={numberOfLines}
        className={`text-[16px] tracking-wide text-center flex-shrink ${getVariantTextClass()} ${textClassName}`}>
        {label}
      </Text>
    </AnimatedPressable>
  );
};
