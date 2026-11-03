import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TodayMealDose } from '@/types';
import { formatTo12Hour } from '@/utils/date.utils';
import { StatusBadge } from './status-badge';
import { PrimaryButton } from './primary-button';

interface MealCardProps {
  meal: TodayMealDose;
  onMarkDone: (meal: TodayMealDose) => void;
  onMarkSkipped: (meal: TodayMealDose) => void;
  onEdit?: (meal: TodayMealDose) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  onMarkDone,
  onMarkSkipped,
  onEdit,
}) => {
  const isCompleted = meal.status === 'completed';

  const renderMealIcon = () => {
    switch (meal.mealType) {
      case 'breakfast':
        return <MaterialCommunityIcons name="coffee-outline" size={24} color="#3D5A50" />;
      case 'lunch':
        return <MaterialCommunityIcons name="food-apple-outline" size={24} color="#3D5A50" />;
      case 'dinner':
        return <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="#3D5A50" />;
      default:
        return <MaterialCommunityIcons name="cookie-outline" size={24} color="#3D5A50" />;
    }
  };

  const cardStyle = isCompleted
    ? 'bg-herbal-tint/30 border border-herbal/30'
    : 'bg-card border-[1.5px] border-subtle-border';

  return (
    <View className={`rounded-2xl p-4 mb-2.5 ${cardStyle}`}>
      <View className="flex-row items-center gap-3">
        <View className="w-12 h-12 rounded-xl border border-subtle-border bg-surface items-center justify-center">
          {renderMealIcon()}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-charcoal">
            {meal.label}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons name="time-outline" size={14} color="#6B645D" />
            <Text className="text-sm font-semibold text-umber">
              {formatTo12Hour(meal.targetTime)}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-1">
          <StatusBadge status={meal.status} type="meal" />
          {onEdit ? (
            <Pressable
              onPress={() => onEdit(meal)}
              className="min-w-[44px] min-h-[44px] items-center justify-center rounded-xl active:bg-surface"
              accessibilityRole="button"
              accessibilityLabel={`Edit ${meal.label} time`}>
              <Ionicons name="pencil" size={18} color="#6B645D" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="mt-2.5">
        {!isCompleted ? (
          <PrimaryButton
            label="Mark Done"
            icon={<Ionicons name="checkmark-sharp" size={20} color="#3D5A50" />}
            variant="outline"
            onPress={() => onMarkDone(meal)}
            className="min-h-[48px]"
          />
        ) : (
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-1.5 flex-1 pr-2">
              <Ionicons name="checkmark-circle" size={18} color="#2E684D" />
              <Text className="text-[15px] font-bold text-herbal">
                Meal completed
              </Text>
            </View>
            <PrimaryButton
              label="Reset"
              variant="ghost"
              onPress={() => onMarkSkipped(meal)}
              className="min-h-[44px] min-w-[70px] px-3"
            />
          </View>
        )}
      </View>
    </View>
  );
};
