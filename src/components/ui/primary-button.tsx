import React from 'react';
import { Pressable, Text, ViewStyle } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
    if (disabled) return 'bg-surface dark:bg-surface-dark opacity-60';
    switch (variant) {
      case 'primary':
        return 'bg-sage active:bg-[#2E443C]';
      case 'secondary':
        return 'bg-terracotta active:bg-[#A85338]';
      case 'outline':
        return 'bg-card dark:bg-card-dark border-[1.5px] border-subtle-border dark:border-subtle-border-dark active:bg-surface dark:active:bg-surface-dark';
      case 'ghost':
        return 'bg-transparent active:bg-surface dark:active:bg-surface-dark';
      default:
        return 'bg-sage active:bg-[#2E443C]';
    }
  };

  const getVariantTextClass = () => {
    if (disabled) return 'text-muted-gray dark:text-muted-gray-dark';
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white';
      case 'outline':
        return 'text-sage dark:text-sage-dark';
      case 'ghost':
        return 'text-umber dark:text-umber-dark';
      default:
        return 'text-white';
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
      className={`min-h-[56px] flex-row items-center justify-center px-5 rounded-2xl gap-2 ${getVariantButtonClass()} ${className}`}>
      {icon}
      <Text className={`text-[17px] font-semibold tracking-wide ${getVariantTextClass()}`}>
        {label}
      </Text>
    </Pressable>
  );
};
