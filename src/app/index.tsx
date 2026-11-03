import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app.store';
import { medicineService } from '@/services/medicine.service';
import { bloodSugarService } from '@/services/blood-sugar.service';
import { TodayMedicineDose, BloodSugarLog } from '@/types';
import {
  MedicineCard,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  HomeSkeleton,
} from '@/components/ui';
import { AddMedicineModal } from '@/components/add-medicine-modal';
import { AddEditSugarModal } from '@/components/add-edit-sugar-modal';
import { formatTo12Hour } from '@/utils/date.utils';
import {
  getSugarCategory,
  getSugarCategoryStyle,
  getSugarContextLabel,
} from '@/utils/sugar.utils';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const router = useRouter();
  const colors = useTheme();
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [doses, setDoses] = useState<TodayMedicineDose[]>([]);
  const [todaySugarLogs, setTodaySugarLogs] = useState<BloodSugarLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSugarModalOpen, setIsSugarModalOpen] = useState(false);
  const [selectedSugarLog, setSelectedSugarLog] = useState<BloodSugarLog | null>(null);

  // Load today's doses and sugar logs from SQLite
  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const todayPrefix = new Date().toISOString().substring(0, 10);
      const [todayDoses, allSugar] = await Promise.all([
        medicineService.getTodayDoses(todayPrefix),
        bloodSugarService.getAllLogs(),
      ]);

      const todaySugar = allSugar.filter(
        (l) => l.loggedAt.substring(0, 10) === todayPrefix
      );

      setDoses(todayDoses);
      setTodaySugarLogs(todaySugar);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError("We couldn't load today's routine. Please try again.");
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

  const handleOpenAddSugar = () => {
    setSelectedSugarLog(null);
    setIsSugarModalOpen(true);
  };

  const handleOpenEditSugar = (log: BloodSugarLog) => {
    setSelectedSugarLog(log);
    setIsSugarModalOpen(true);
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

  // Today's sugar average
  const todaySugarAvg =
    todaySugarLogs.length > 0
      ? Math.round(
          todaySugarLogs.reduce((acc, curr) => acc + curr.level, 0) / todaySugarLogs.length
        )
      : null;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ backgroundColor: colors.background }}
      className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="px-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* Header Greeting & Settings Button */}
        <View className="pt-3 pb-2 flex-row justify-between items-start">
          <View className="gap-1 flex-1 pr-2">
            <Text className="text-[28px] font-bold tracking-wide text-charcoal dark:text-charcoal-dark">
              {greeting}
            </Text>
            <Text className="text-base font-semibold text-umber dark:text-umber-dark">
              {formattedDate}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
            accessibilityRole="button"
            accessibilityLabel="Open settings and display theme">
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <HomeSkeleton />
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
            {/* Next Important Action Hero Card */}
            {isMultiMedicineGroup ? (
              <View className="rounded-2xl border-2 border-sage dark:border-sage-dark bg-sage-tint dark:bg-sage-dark-tint p-4 mt-3 mb-2 gap-2 overflow-hidden">
                <View className="flex-row justify-between items-start gap-2">
                  <View className="flex-row items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                    <Ionicons name="notifications" size={14} color={colors.primary} />
                    <Text className="text-[13px] font-bold tracking-wider text-sage dark:text-sage-dark uppercase">
                      {nextPendingDose.timeSlot} Routine
                    </Text>
                    <View className="bg-sage/15 dark:bg-sage/25 px-2.5 py-1 rounded-xl">
                      <Text className="text-xs font-bold text-sage dark:text-sage-dark">
                        {sameSlotPendingDoses.length} Meds
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1 shrink-0 bg-sage/10 dark:bg-sage/20 px-2.5 py-1 rounded-xl">
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text className="text-sm font-bold text-sage dark:text-sage-dark">
                      {formatTo12Hour(nextPendingDose.reminderTime)}
                    </Text>
                  </View>
                </View>

                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  Time for your {nextPendingDose.timeSlot} medicines
                </Text>

                {/* List of medicines to take together */}
                <View className="gap-2 my-1 bg-card/90 dark:bg-card-dark p-3.5 rounded-xl border border-subtle-border dark:border-subtle-border-dark">
                  {sameSlotPendingDoses.map((dose) => (
                    <View key={dose.scheduleId} className="flex-row items-center justify-between gap-2">
                      <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-1">
                        <View className="w-2.5 h-2.5 rounded-full bg-sage shrink-0" />
                        <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark flex-1" numberOfLines={2}>
                          {dose.medicineName}
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-terracotta dark:text-terracotta-dark shrink-0">
                        {dose.dosage}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="mt-1">
                  <PrimaryButton
                    label={`Take All ${sameSlotPendingDoses.length} Medicines Now`}
                    icon={<Ionicons name="checkmark-done-sharp" size={22} color="#FFFFFF" />}
                    variant="primary"
                    onPress={() => handleTakeAllSameSlot(sameSlotPendingDoses)}
                    className="min-h-[48px]"
                  />
                </View>
              </View>
            ) : nextPendingDose ? (
              <View className="rounded-2xl border-2 border-sage dark:border-sage-dark bg-sage-tint dark:bg-sage-dark-tint p-4 mt-3 mb-2 gap-1.5 overflow-hidden">
                <View className="flex-row justify-between items-center gap-2">
                  <View className="flex-row items-center gap-1 flex-1 min-w-0">
                    <Ionicons name="notifications" size={14} color={colors.primary} />
                    <Text className="text-[13px] font-bold tracking-wider text-sage dark:text-sage-dark">
                      NEXT DOSE
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1 shrink-0 bg-sage/10 dark:bg-sage/20 px-2.5 py-1 rounded-xl">
                    <Ionicons name="time-outline" size={15} color={colors.primary} />
                    <Text className="text-base font-bold text-sage dark:text-sage-dark">
                      {formatTo12Hour(nextPendingDose.reminderTime)}
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark">
                  {nextPendingDose.medicineName}
                </Text>
                <Text className="text-lg font-bold text-terracotta dark:text-terracotta-dark">
                  {nextPendingDose.dosage}
                </Text>
                {nextPendingDose.instructions ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                    <Text className="text-[15px] font-medium text-umber dark:text-umber-dark flex-1">
                      {nextPendingDose.instructions}
                    </Text>
                  </View>
                ) : null}
                <View className="mt-2">
                  <PrimaryButton
                    label="Take Medicine Now"
                    icon={<Ionicons name="checkmark-sharp" size={22} color="#FFFFFF" />}
                    variant="primary"
                    onPress={() => handleMarkTaken(nextPendingDose)}
                    className="min-h-[48px]"
                  />
                </View>
              </View>
            ) : totalMeds > 0 ? (
              <View className="flex-row items-center gap-3.5 rounded-2xl border-[1.5px] border-herbal dark:border-herbal-dark bg-herbal-tint dark:bg-herbal-dark-tint p-4 mt-3 mb-2">
                <Ionicons name="checkmark-done-circle" size={36} color={colors.success} />
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
                  icon={<Ionicons name="add-sharp" size={21} color={colors.primary} />}
                  variant="outline"
                  onPress={() => setIsAddModalOpen(true)}
                  className="min-h-[44px] px-4"
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

            {/* Today's Blood Sugar Section */}
            <SectionHeader
              title="Today's Blood Sugar"
              subtitle={
                todaySugarAvg !== null
                  ? `Average: ${todaySugarAvg} mg/dL (${todaySugarLogs.length} logged)`
                  : 'Maintain a steady glucose routine'
              }
              rightElement={
                <PrimaryButton
                  label="Log Sugar"
                  icon={<Ionicons name="add-sharp" size={21} color={colors.primary} />}
                  variant="outline"
                  onPress={handleOpenAddSugar}
                  className="min-h-[44px] px-4"
                />
              }
            />

            {todaySugarLogs.length === 0 ? (
              <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 my-1 gap-3 items-center">
                <View className="w-12 h-12 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
                  <Ionicons name="water-outline" size={24} color={colors.secondary} />
                </View>
                <View className="gap-0.5 items-center">
                  <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark text-center">
                    No sugar checks logged today
                  </Text>
                  <Text className="text-xs font-medium text-umber dark:text-umber-dark text-center">
                    Check fasting or post-meal glucose to stay on top of your routine.
                  </Text>
                </View>
                <PrimaryButton
                  label="Log Blood Sugar"
                  icon={<Ionicons name="add-sharp" size={21} color="#FFFFFF" />}
                  variant="primary"
                  onPress={handleOpenAddSugar}
                  className="min-h-[44px] px-5"
                />
              </View>
            ) : (
              <View className="gap-2.5">
                {todaySugarLogs.map((log) => {
                  const category = getSugarCategory(log.level, log.context);
                  const style = getSugarCategoryStyle(category);
                  const dateObj = new Date(log.loggedAt);
                  const formattedTime = formatTo12Hour(dateObj);

                  return (
                    <Pressable
                      key={log.id}
                      onPress={() => handleOpenEditSugar(log)}
                      className="min-h-[58px] rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-3.5 gap-2 active:bg-card-selected"
                      accessibilityRole="button"
                      accessibilityLabel={`Reading ${log.level} mg/dL at ${formattedTime}. Tap to edit.`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
                            <Ionicons name="water" size={18} color={colors.secondary} />
                          </View>
                          <View>
                            <View className="flex-row items-baseline gap-1.5">
                              <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                                {log.level}
                              </Text>
                              <Text className="text-xs font-bold text-umber dark:text-umber-dark">
                                mg/dL
                              </Text>
                            </View>
                            <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                              {getSugarContextLabel(log.context)} · {formattedTime}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          <View
                            className={`px-2.5 py-1 rounded-xl border ${style.badgeBg} ${style.badgeBorder}`}>
                            <Text className={`text-xs font-bold ${style.textColor}`}>
                              {style.label}
                            </Text>
                          </View>
                          <Ionicons name="pencil" size={18} color="#8E867E" />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
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

      {/* Add / Edit Sugar Modal */}
      <AddEditSugarModal
        visible={isSugarModalOpen}
        initialLog={selectedSugarLog}
        onClose={() => setIsSugarModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />
    </SafeAreaView>
  );
}
