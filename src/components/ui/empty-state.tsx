import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { PrimaryButton } from './primary-button';

export interface EmptyStateProps {
  iconName?: string;
  iconFamily?: 'material' | 'ionicons';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

/**
 * EmptyState
 * A warm, calm, welcoming empty state designed for Mom.
 * Shows solid surfaces, high contrast, and comfortable touch targets.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'calendar-clock',
  iconFamily = 'material',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const colors = useTheme();

  return (
    <View
      style={{ backgroundColor: colors.backgroundCard }}
      className="rounded-3xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark p-7 items-center justify-center my-3 gap-2.5 shadow-sm">
      {/* Icon Bubble */}
      <View
        style={{ backgroundColor: colors.backgroundElement }}
        className="w-16 h-16 rounded-2xl border border-subtle-border dark:border-subtle-border-dark items-center justify-center mb-1">
        {iconFamily === 'ionicons' ? (
          <Ionicons name={iconName as any} size={32} color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name={iconName as any} size={32} color={colors.primary} />
        )}
      </View>

      {/* Title */}
      <Text className="text-[20px] font-bold text-center text-charcoal dark:text-charcoal-dark px-2">
        {title}
      </Text>

      {/* Description */}
      <Text className="text-[15px] font-medium text-center leading-[22px] mb-3 text-umber dark:text-umber-dark max-w-[300px]">
        {description}
      </Text>

      {/* Action Buttons */}
      {actionLabel && onAction ? (
        <View className="items-center gap-2 w-full max-w-[260px]">
          <PrimaryButton
            label={actionLabel}
            onPress={onAction}
            variant="primary"
            className="w-full min-h-[48px] px-5"
            numberOfLines={1}
          />

          {secondaryActionLabel && onSecondaryAction ? (
            <PrimaryButton
              label={secondaryActionLabel}
              onPress={onSecondaryAction}
              variant="outline"
              className="w-full min-h-[46px] px-4"
              numberOfLines={1}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
