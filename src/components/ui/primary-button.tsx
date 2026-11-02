import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  icon,
  style,
  className = '',
}) => {
  const getVariantButtonClass = () => {
    if (disabled) return 'bg-surface opacity-60 border border-subtle-border';
    switch (variant) {
      case 'primary':
        return 'bg-sage active:bg-[#2E443C]';
      case 'secondary':
        return 'bg-terracotta active:bg-[#A85338]';
      case 'outline':
        return 'bg-card border-[1.5px] border-subtle-border active:bg-surface';
      case 'danger':
        return 'bg-card border-[1.5px] border-brick active:bg-brick-tint';
      case 'ghost':
        return 'bg-transparent active:bg-surface';
      default:
        return 'bg-sage active:bg-[#2E443C]';
    }
  };

  const getVariantTextClass = () => {
    if (disabled) return 'text-umber';
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white font-bold';
      case 'outline':
        return 'text-sage font-bold';
      case 'danger':
        return 'text-brick font-bold';
      case 'ghost':
        return 'text-umber font-semibold';
      default:
        return 'text-white font-bold';
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={style}
      className={`min-h-[50px] flex-row items-center justify-center px-4 rounded-xl gap-2 ${getVariantButtonClass()} ${className}`}>
      {icon}
      <Text className={`text-[16px] tracking-wide text-center flex-shrink ${getVariantTextClass()}`}>
        {label}
      </Text>
    </Pressable>
  );
};
