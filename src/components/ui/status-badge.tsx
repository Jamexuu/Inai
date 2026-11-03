import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicineDoseStatus, MealStatus } from '@/types';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface StatusBadgeProps {
  status: MedicineDoseStatus | MealStatus;
  type?: 'medicine' | 'meal';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors = useTheme();
  const isDark = useColorScheme() === 'dark';

  let label = 'Due';
  let iconName: keyof typeof Ionicons.glyphMap = 'time-outline';
  let badgeClasses = 'bg-amber-tint border-amber dark:bg-amber-dark-tint dark:border-amber-dark';
  let textClasses = 'text-amber dark:text-amber-dark';
  let iconColor: string = isDark ? colors.warning : '#A8631E';

  if (status === 'taken' || status === 'completed') {
    label = status === 'taken' ? 'Taken' : 'Done';
    iconName = 'checkmark-circle';
    badgeClasses = 'bg-herbal-tint border-herbal dark:bg-herbal-dark-tint dark:border-herbal-dark';
    textClasses = 'text-herbal dark:text-herbal-dark';
    iconColor = isDark ? colors.success : '#2E684D';
  } else if (status === 'skipped') {
    label = 'Skipped';
    iconName = 'close-circle-outline';
    badgeClasses = 'bg-surface border-subtle-border dark:bg-surface-dark dark:border-subtle-border-dark';
    textClasses = 'text-umber dark:text-umber-dark';
    iconColor = colors.textSecondary;
  } else if (status === 'missed') {
    label = 'Missed';
    iconName = 'alert-circle';
    badgeClasses = 'bg-brick-tint border-brick dark:bg-brick-dark-tint dark:border-brick-dark';
    textClasses = 'text-brick dark:text-brick-dark';
    iconColor = isDark ? colors.error : '#A33B32';
  }

  return (
    <View
      className={`flex-row items-center px-3 py-1.5 rounded-xl border gap-1.5 self-start ${badgeClasses}`}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}>
      <Ionicons name={iconName} size={15} color={iconColor} />
      <Text className={`text-sm font-bold tracking-wide ${textClasses}`}>
        {label}
      </Text>
    </View>
  );
};
