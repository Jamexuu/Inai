import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PrimaryButton } from './primary-button';

interface EmptyStateProps {
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  iconName = 'calendar-clock',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-surface p-6 items-center justify-center my-4 gap-2.5">
      <View className="w-16 h-16 rounded-2xl border border-subtle-border bg-card items-center justify-center mb-1">
        <MaterialCommunityIcons name={iconName} size={32} color="#3D5A50" />
      </View>
      <Text className="text-xl font-bold text-center text-charcoal">
        {title}
      </Text>
      <Text className="text-base font-medium text-center leading-[22px] mb-2 text-umber max-w-[280px]">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          className="min-w-[180px] min-h-[48px]"
        />
      ) : null}
    </View>
  );
};
