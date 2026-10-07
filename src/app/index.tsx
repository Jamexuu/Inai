import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app.store';
import { medicineService } from '@/services/medicine.service';
import { mealService } from '@/services/meal.service';
import { TodayMedicineDose, TodayMealDose } from '@/types';
import {
  MedicineCard,
  MealCard,
  SectionHeader,
  PrimaryButton,
  EmptyState,
} from '@/components/ui';
import { AddMedicineModal } from '@/components/add-medicine-modal';

export default function HomeScreen() {
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [doses, setDoses] = useState<TodayMedicineDose[]>([]);
  const [meals, setMeals] = useState<TodayMealDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load today's doses and meals from SQLite
  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    try {
      const todayPrefix = new Date().toISOString().substring(0, 10);
      const [todayDoses, todayMeals] = await Promise.all([
        medicineService.getTodayDoses(todayPrefix),
        mealService.getTodayMeals(todayPrefix),
      ]);
      setDoses(todayDoses);
      setMeals(todayMeals);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
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

  // Mark medicine dose as taken
  const handleMarkTaken = async (dose: TodayMedicineDose) => {
    const todayPrefix = new Date().toISOString().substring(0, 10);
    const scheduledTime = `${todayPrefix} ${dose.reminderTime}`;
    await medicineService.markDose({
      medicineId: dose.medicineId,
      scheduleId: dose.scheduleId,
      scheduledTime,
      status: 'taken',
    });
    triggerRefresh();
  };

  // Mark medicine dose as skipped
  const handleMarkSkipped = async (dose: TodayMedicineDose) => {
    const todayPrefix = new Date().toISOString().substring(0, 10);
    const scheduledTime = `${todayPrefix} ${dose.reminderTime}`;
    await medicineService.markDose({
      medicineId: dose.medicineId,
      scheduleId: dose.scheduleId,
      scheduledTime,
      status: 'skipped',
    });
    triggerRefresh();
  };

  // Mark meal completed
  const handleMarkMealDone = async (meal: TodayMealDose) => {
    await mealService.markMeal({
      mealType: meal.mealType,
      status: 'completed',
      mealId: meal.mealId,
    });
    triggerRefresh();
  };

  // Mark meal skipped / reset
  const handleMarkMealSkipped = async (meal: TodayMealDose) => {
    await mealService.markMeal({
      mealType: meal.mealType,
      status: 'pending',
      mealId: meal.mealId,
    });
    triggerRefresh();
  };

  // Greeting & Date formatting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning, Mom' : currentHour < 18 ? 'Good afternoon, Mom' : 'Good evening, Mom';

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Calculate progress
  const completedMeds = doses.filter((d) => d.status === 'taken').length;
  const totalMeds = doses.length;
  const nextPendingDose = doses.find((d) => d.status === 'pending');

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="px-4 pb-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Header Greeting */}
        <View className="pt-3 pb-2 gap-1">
          <Text className="text-[28px] font-bold tracking-wide text-charcoal dark:text-charcoal-dark">
            {greeting}
          </Text>
          <Text className="text-base font-medium text-umber dark:text-umber-dark">
            {formattedDate}
          </Text>
        </View>

        {loading ? (
          <View className="py-16 items-center gap-3">
            <ActivityIndicator size="large" color="#3D5A50" />
            <Text className="text-base font-medium text-umber dark:text-umber-dark">
              Loading today&apos;s routine...
            </Text>
          </View>
        ) : (
          <>
            {/* Next Important Action Hero Card */}
            {nextPendingDose ? (
              <View className="rounded-2xl border-2 border-sage bg-sage-tint dark:bg-sage-dark-tint p-4 mt-3 mb-2 gap-1.5">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="notifications" size={14} color="#3D5A50" />
                    <Text className="text-[13px] font-bold tracking-wider text-sage dark:text-sage-dark">
                      NEXT MEDICINE TO TAKE
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={16} color="#3D5A50" />
                    <Text className="text-base font-bold text-sage dark:text-sage-dark">
                      {nextPendingDose.reminderTime}
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark">
                  {nextPendingDose.medicineName}
                </Text>
                <Text className="text-lg font-semibold text-terracotta dark:text-terracotta-dark">
                  {nextPendingDose.dosage}
                </Text>
                {nextPendingDose.instructions ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Ionicons name="information-circle-outline" size={16} color="#6B645D" />
                    <Text className="text-[15px] font-medium text-umber dark:text-umber-dark flex-1">
                      {nextPendingDose.instructions}
                    </Text>
                  </View>
                ) : null}
                <View className="mt-2">
                  <PrimaryButton
                    label="Take Medicine Now"
                    icon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                    variant="primary"
                    onPress={() => handleMarkTaken(nextPendingDose)}
                  />
                </View>
              </View>
            ) : totalMeds > 0 ? (
              <View className="flex-row items-center gap-3.5 rounded-2xl border-[1.5px] border-herbal bg-herbal-tint dark:bg-herbal-dark-tint p-4 mt-3 mb-2">
                <Ionicons name="checkmark-done-circle" size={36} color="#2E684D" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-lg font-bold text-herbal dark:text-herbal-dark">
                    All medicines completed!
                  </Text>
                  <Text className="text-sm font-medium leading-5 text-umber dark:text-umber-dark">
                    Wonderful job today, Mom. Rest easy and stay hydrated.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Today's Medicines Section */}
            <SectionHeader
              title="Today's Medicines"
              subtitle={totalMeds > 0 ? `${completedMeds} of ${totalMeds} taken` : undefined}
              rightElement={
                <PrimaryButton
                  label="Add"
                  icon={<Ionicons name="add" size={18} color="#3D5A50" />}
                  variant="outline"
                  onPress={() => setIsAddModalOpen(true)}
                  className="min-h-[40px] px-3.5"
                />
              }
            />

            {doses.length === 0 ? (
              <EmptyState
                iconName="pill"
                title="No medicines scheduled yet"
                description="Add your first maintenance medicine so Inai can gently remind you every day."
                actionLabel="Add Medicine"
                onAction={() => setIsAddModalOpen(true)}
              />
            ) : (
              doses.map((dose) => (
                <MedicineCard
                  key={dose.scheduleId}
                  dose={dose}
                  onMarkTaken={handleMarkTaken}
                  onMarkSkipped={handleMarkSkipped}
                />
              ))
            )}

            {/* Today's Meals Section */}
            <SectionHeader
              title="Today's Meals"
              subtitle="Keep a calm, steady meal routine"
            />

            {meals.map((meal) => (
              <MealCard
                key={meal.mealType}
                meal={meal}
                onMarkDone={handleMarkMealDone}
                onMarkSkipped={handleMarkMealSkipped}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Medicine Modal */}
      <AddMedicineModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />
    </SafeAreaView>
  );
}
