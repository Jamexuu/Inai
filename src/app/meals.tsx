import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AddEditMealModal } from '@/components/add-edit-meal-modal';
import {
  EmptyState,
  MealCard,
  PrimaryButton,
  SectionHeader,
  MealsSkeleton,
} from '@/components/ui';
import { mealService } from '@/services/meal.service';
import { useAppStore } from '@/store/app.store';
import { Meal, TodayMealDose } from '@/types';

export default function MealsScreen() {
  const router = useRouter();
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [meals, setMeals] = useState<TodayMealDose[]>([]);
  const [allMealEntities, setAllMealEntities] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const todayPrefix = new Date().toISOString().substring(0, 10);
      const [todayMeals, allMeals] = await Promise.all([
        mealService.getTodayMeals(todayPrefix),
        mealService.getAllMeals(),
      ]);
      setMeals(todayMeals);
      setAllMealEntities(allMeals);
    } catch (err) {
      console.error('Error loading meals data:', err);
      setError("We couldn't load your meal routine. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDatabaseReady]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger, isDatabaseReady]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleMarkMealDone = async (meal: TodayMealDose) => {
    await mealService.markMeal({
      mealType: meal.mealType,
      status: 'completed',
      mealId: meal.mealId,
    });
    triggerRefresh();
  };

  const handleMarkMealSkipped = async (meal: TodayMealDose) => {
    await mealService.markMeal({
      mealType: meal.mealType,
      status: 'skipped',
      mealId: meal.mealId,
    });
    triggerRefresh();
  };

  const handleOpenAdd = () => {
    setSelectedMeal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dose: TodayMealDose) => {
    const fullMeal = allMealEntities.find((m) => m.id === dose.mealId) ||
      allMealEntities.find((m) => m.mealType === dose.mealType) || {
        id: dose.mealId || `meal_${dose.mealType}`,
        mealType: dose.mealType,
        targetTime: dose.targetTime,
        label: dose.label,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    setSelectedMeal(fullMeal);
    setIsModalOpen(true);
  };

  const completedCount = meals.filter((m) => m.status === 'completed').length;
  const totalCount = meals.length;

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }>
        {/* Header & Settings Button */}
        <View className="pt-3 pb-3 flex-row justify-between items-start">
          <View className="gap-1 flex-1 pr-2">
            <Text className="text-[28px] font-bold text-charcoal">
              Daily Meals
            </Text>
            <Text className="text-base font-semibold text-umber">
              {formattedDate} (steady routine for Mom)
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface border border-subtle-border active:bg-card-selected"
            accessibilityRole="button"
            accessibilityLabel="Open settings and display theme">
            <Ionicons name="settings-outline" size={22} color="#3D5A50" />
          </Pressable>
        </View>

        {loading ? (
          <MealsSkeleton />
        ) : error ? (
          <View className="rounded-2xl border-[1.5px] border-brick/40 bg-brick-tint/50 p-5 my-4 gap-3 items-center">
            <Ionicons name="alert-circle-outline" size={32} color="#A33B32" />
            <Text className="text-lg font-bold text-charcoal text-center">
              {error}
            </Text>
            <PrimaryButton
              label="Try Again"
              icon={<Ionicons name="refresh" size={18} color="#FFFFFF" />}
              variant="primary"
              onPress={loadData}
              className="min-h-[44px] min-w-[140px]"
            />
          </View>
        ) : (
          <>
            <SectionHeader
              title="Today's Meal Schedule"
              subtitle={
                totalCount > 0
                  ? `${completedCount} of ${totalCount} recorded`
                  : undefined
              }
              rightElement={
                <PrimaryButton
                  label="Add Meal"
                  icon={<Ionicons name="add-sharp" size={21} color="#3D5A50" />}
                  variant="outline"
                  onPress={handleOpenAdd}
                  className="min-h-[44px] px-4"
                />
              }
            />

            {meals.length === 0 ? (
              <EmptyState
                iconName="silverware-fork-knife"
                title="No meals scheduled"
                description="Add your daily meals so you can maintain a steady routine."
                actionLabel="Add Meal"
                onAction={handleOpenAdd}
              />
            ) : (
              meals.map((meal) => (
                <MealCard
                  key={meal.mealId || meal.mealType}
                  meal={meal}
                  onMarkDone={handleMarkMealDone}
                  onMarkSkipped={handleMarkMealSkipped}
                  onEdit={handleOpenEdit}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add / Edit Meal Modal */}
      <AddEditMealModal
        visible={isModalOpen}
        initialMeal={selectedMeal}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />
    </SafeAreaView>
  );
}
