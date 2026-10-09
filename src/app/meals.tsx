import { AddEditMealModal } from "@/components/add-edit-meal-modal";
import {
  EmptyState,
  MealCard,
  PrimaryButton,
  SectionHeader,
  MealsSkeleton,
} from "@/components/ui";
import { mealService } from "@/services/meal.service";
import { useAppStore } from "@/store/app.store";
import { Meal, TodayMealDose } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealsScreen() {
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [meals, setMeals] = useState<TodayMealDose[]>([]);
  const [allMealEntities, setAllMealEntities] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    try {
      const todayPrefix = new Date().toISOString().substring(0, 10);
      const [todayMeals, allMeals] = await Promise.all([
        mealService.getTodayMeals(todayPrefix),
        mealService.getAllMeals(),
      ]);
      setMeals(todayMeals);
      setAllMealEntities(allMeals);
    } catch (err) {
      console.error("Error loading meals data:", err);
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
      status: "completed",
      mealId: meal.mealId,
    });
    triggerRefresh();
  };

  const handleMarkMealSkipped = async (meal: TodayMealDose) => {
    await mealService.markMeal({
      mealType: meal.mealType,
      status: "skipped",
      mealId: meal.mealId,
    });
    triggerRefresh();
  };

  const handleOpenAdd = () => {
    setSelectedMeal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dose: TodayMealDose) => {
    // Find the full Meal entity by id or mealType
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

  const completedCount = meals.filter((m) => m.status === "completed").length;
  const totalCount = meals.length;

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="pt-3 pb-3 gap-1">
          <Text className="text-[28px] font-bold text-charcoal">
            Daily Meals
          </Text>
          <Text className="text-base font-normal text-umber">
            {formattedDate} · Keep a calm, steady eating routine.
          </Text>
        </View>

        {loading ? (
          <MealsSkeleton />
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
                  icon={<Ionicons name="add" size={18} color="#3D5A50" />}
                  variant="outline"
                  onPress={handleOpenAdd}
                  className="min-h-[40px] px-3.5"
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
