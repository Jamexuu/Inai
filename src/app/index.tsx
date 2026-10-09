import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
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
  HomeSkeleton,
} from '@/components/ui';
import { AddMedicineModal } from '@/components/add-medicine-modal';
import { formatTo12Hour } from '@/utils/date.utils';

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
  const pendingDoses = doses.filter((d) => d.status === 'pending');
  const nextPendingDose = pendingDoses[0] || null;

  // Group pending doses that share the same time slot as nextPendingDose
  const sameSlotPendingDoses = nextPendingDose
    ? pendingDoses.filter((d) => d.timeSlot === nextPendingDose.timeSlot)
    : [];
  const isMultiMedicineGroup = sameSlotPendingDoses.length > 1;

  const handleTakeAllSameSlot = async (groupDoses: TodayMedicineDose[]) => {
    await medicineService.markMultipleDosesTaken(groupDoses);
    triggerRefresh();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Header Greeting */}
        <View className="pt-3 pb-2 gap-1">
          <Text className="text-[28px] font-bold tracking-wide text-charcoal">
            {greeting}
          </Text>
          <Text className="text-base font-medium text-umber">
            {formattedDate}
          </Text>
        </View>

        {loading ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* Next Important Action Hero Card */}
            {isMultiMedicineGroup ? (
              <View className="rounded-2xl border-2 border-sage bg-sage-tint p-4 mt-3 mb-2 gap-2 overflow-hidden">
                <View className="flex-row justify-between items-start gap-2">
                  <View className="flex-row items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                    <Ionicons name="notifications" size={14} color="#3D5A50" />
                    <Text className="text-[13px] font-bold tracking-wider text-sage uppercase">
                      {nextPendingDose.timeSlot} Routine
                    </Text>
                    <View className="bg-sage/15 px-2 py-0.5 rounded-md">
                      <Text className="text-[11px] font-bold text-sage">
                        {sameSlotPendingDoses.length} Meds
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1 shrink-0 bg-sage/10 px-2 py-0.5 rounded-lg">
                    <Ionicons name="time-outline" size={14} color="#3D5A50" />
                    <Text className="text-sm font-bold text-sage">
                      {formatTo12Hour(nextPendingDose.reminderTime)}
                    </Text>
                  </View>
                </View>

                <Text className="text-xl font-bold text-charcoal">
                  Time for your {nextPendingDose.timeSlot} medicines
                </Text>

                {/* List of medicines to take together */}
                <View className="gap-2 my-1 bg-card/80 p-3 rounded-xl border border-subtle-border">
                  {sameSlotPendingDoses.map((dose) => (
                    <View key={dose.scheduleId} className="flex-row items-center justify-between gap-2">
                      <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-1">
                        <View className="w-2.5 h-2.5 rounded-full bg-sage shrink-0" />
                        <Text className="text-base font-bold text-charcoal flex-1" numberOfLines={2}>
                          {dose.medicineName}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-terracotta shrink-0">
                        {dose.dosage}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-1">
                  <PrimaryButton
                    label={`Take All ${sameSlotPendingDoses.length} Medicines Now`}
                    icon={<Ionicons name="checkmark-done" size={20} color="#FFFFFF" />}
                    variant="primary"
                    onPress={() => handleTakeAllSameSlot(sameSlotPendingDoses)}
                  />
                </View>
              </View>
            ) : nextPendingDose ? (
              <View className="rounded-2xl border-2 border-sage bg-sage-tint p-4 mt-3 mb-2 gap-1.5 overflow-hidden">
                <View className="flex-row justify-between items-center gap-2">
                  <View className="flex-row items-center gap-1 flex-1 min-w-0">
                    <Ionicons name="notifications" size={14} color="#3D5A50" />
                    <Text className="text-[13px] font-bold tracking-wider text-sage">
                      NEXT DOSE
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 shrink-0">
                    <Ionicons name="time-outline" size={16} color="#3D5A50" />
                    <Text className="text-base font-bold text-sage">
                      {formatTo12Hour(nextPendingDose.reminderTime)}
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-charcoal">
                  {nextPendingDose.medicineName}
                </Text>
                <Text className="text-lg font-semibold text-terracotta">
                  {nextPendingDose.dosage}
                </Text>
                {nextPendingDose.instructions ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Ionicons name="information-circle-outline" size={16} color="#6B645D" />
                    <Text className="text-[15px] font-medium text-umber flex-1">
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
              <View className="flex-row items-center gap-3.5 rounded-2xl border-[1.5px] border-herbal bg-herbal-tint p-4 mt-3 mb-2">
                <Ionicons name="checkmark-done-circle" size={36} color="#2E684D" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-lg font-bold text-herbal">
                    All medicines completed!
                  </Text>
                  <Text className="text-sm font-medium leading-5 text-umber">
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
        initialMode="existing"
      />
    </SafeAreaView>
  );
}
