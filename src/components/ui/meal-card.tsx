import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TodayMealDose } from '@/types';
import { formatTo12Hour } from '@/utils/date.utils';
import { StatusBadge } from './status-badge';
import { PrimaryButton } from './primary-button';

interface MealCardProps {
  meal: TodayMealDose;
  onMarkDone: (meal: TodayMealDose) => void;
  onMarkSkipped: (meal: TodayMealDose) => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onMarkDone, onMarkSkipped }) => {
  const isCompleted = meal.status === 'completed';

  const renderMealIcon = () => {
    switch (meal.mealType) {
      case 'breakfast':
        return <MaterialCommunityIcons name="coffee-outline" size={26} color="#3D5A50" />;
      case 'lunch':
        return <MaterialCommunityIcons name="food-apple-outline" size={26} color="#3D5A50" />;
      case 'dinner':
        return <MaterialCommunityIcons name="silverware-fork-knife" size={26} color="#3D5A50" />;
      default:
        return <MaterialCommunityIcons name="cookie-outline" size={26} color="#3D5A50" />;
    }
  };

  return (
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-3.5 mb-2">
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-xl border border-subtle-border bg-surface items-center justify-center">
          {renderMealIcon()}
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-charcoal">
            {meal.label}
          </Text>
          <View className="flex-row items-center gap-1 mt-0.5">
            <Ionicons name="time-outline" size={14} color="#6B645D" />
            <Text className="text-sm font-medium text-umber">
              {formatTo12Hour(meal.targetTime)}
            </Text>
          </View>
        </View>
        <StatusBadge status={meal.status} type="meal" />
      </View>

      <View className="mt-2">
        {!isCompleted ? (
          <PrimaryButton
            label="Mark Done"
            icon={<Ionicons name="checkmark" size={18} color="#3D5A50" />}
            variant="outline"
            onPress={() => onMarkDone(meal)}
            className="min-h-[46px]"
          />
        ) : (
          <View className="flex-row items-center justify-between pt-1">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="checkmark-circle" size={18} color="#2E684D" />
              <Text className="text-[15px] font-semibold text-herbal">
                Meal completed
              </Text>
            </View>
            <PrimaryButton
              label="Reset"
              variant="ghost"
              onPress={() => onMarkSkipped(meal)}
              className="min-h-[36px] px-2.5"
            />
          </View>
        )}
      </View>
    </View>
  );
};
