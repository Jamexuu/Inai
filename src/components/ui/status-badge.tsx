import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicineDoseStatus, MealStatus } from '@/types';

interface StatusBadgeProps {
  status: MedicineDoseStatus | MealStatus;
  type?: 'medicine' | 'meal';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let label = 'Due';
  let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
  let badgeClasses = 'bg-amber-tint border-amber';
  let textClasses = 'text-amber';
  let iconColor = '#A8631E';

  if (status === 'taken' || status === 'completed') {
    label = status === 'taken' ? 'Taken' : 'Done';
    iconName = 'checkmark-circle';
    badgeClasses = 'bg-herbal-tint border-herbal';
    textClasses = 'text-herbal';
    iconColor = '#2E684D';
  } else if (status === 'skipped') {
    label = 'Skipped';
    iconName = 'close-circle-outline';
    badgeClasses = 'bg-card-selected border-subtle-border';
    textClasses = 'text-umber';
    iconColor = '#6B645D';
  } else if (status === 'missed') {
    label = 'Missed';
    iconName = 'alert-circle';
    badgeClasses = 'bg-brick-tint border-brick';
    textClasses = 'text-brick';
    iconColor = '#A33B32';
  }

  return (
    <View
      className={`flex-row items-center px-3 py-1.5 rounded-full border gap-1.5 self-start ${badgeClasses}`}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}>
      <Ionicons name={iconName} size={15} color={iconColor} />
      <Text className={`text-sm font-semibold tracking-wide ${textClasses}`}>
        {label}
      </Text>
    </View>
  );
};
