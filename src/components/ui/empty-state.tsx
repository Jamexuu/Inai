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
  iconName = 'pill-off',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View className="rounded-2xl border border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark p-6 items-center justify-center my-4 gap-2">
      <View className="w-[68px] h-[68px] rounded-full border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark items-center justify-center mb-1.5">
        <MaterialCommunityIcons name={iconName} size={36} color="#3D5A50" />
      </View>
      <Text className="text-xl font-bold text-center text-charcoal dark:text-charcoal-dark">
        {title}
      </Text>
      <Text className="text-base font-normal text-center leading-[22px] mb-2 text-umber dark:text-umber-dark">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onAction}
          variant="primary"
          className="min-w-[180px]"
        />
      ) : null}
    </View>
  );
};
