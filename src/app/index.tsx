import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  SectionHeader,
  PrimaryButton,
  EmptyState,
  HomeSkeleton,
  MedicineGroupCard,
  ConfirmationDialog,
  ScalePressable,
} from '@/components/ui';
import { AddEditSugarModal } from '@/components/add-edit-sugar-modal';
import { formatTo12Hour, formatDateToYMD } from '@/utils/date.utils';
import { groupDosesBySlot } from '@/utils/medicine-group.utils';
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
  const userName = useAppStore((state) => state.userName);

  const [doses, setDoses] = useState<TodayMedicineDose[]>([]);
  const [daySugarLogs, setDaySugarLogs] = useState<BloodSugarLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSugarModalOpen, setIsSugarModalOpen] = useState(false);
  const [selectedSugarLog, setSelectedSugarLog] = useState<BloodSugarLog | null>(null);

  // Skip All confirmation dialog state
  const [skipConfirmation, setSkipConfirmation] = useState<{
    isOpen: boolean;
    doses: TodayMedicineDose[];
    routineName: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    doses: [],
    routineName: '',
    isSubmitting: false,
  });

  // Today's date in YYYY-MM-DD format
  const todayYMD = useMemo(() => formatDateToYMD(new Date()), []);

  // Load today's routine & sugar logs from SQLite
  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const [dayDoses, allSugar] = await Promise.all([
        medicineService.getTodayDoses(todayYMD),
        bloodSugarService.getAllLogs(),
      ]);

      const daySugar = allSugar.filter(
        (l) => l.loggedAt.substring(0, 10) === todayYMD
      );

      setDoses(dayDoses);
      setDaySugarLogs(daySugar);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError("We couldn't load today's routine. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDatabaseReady, todayYMD]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger, isDatabaseReady]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Group doses by routine slot (Morning, Afternoon, Evening, Bedtime)
  const slotGroups = useMemo(() => groupDosesBySlot(doses), [doses]);

  // Overall progress calculations
  const completedMeds = doses.filter((d) => d.status === 'taken').length;
  const totalMeds = doses.length;

  // Next pending routine slot
  const pendingGroups = slotGroups.filter((g) => !g.allTaken && !g.allSkipped);
  const nextPendingGroup = pendingGroups[0] || null;

  // Action: Take all medicines in a slot
  const handleTakeAllSlot = async (groupDoses: TodayMedicineDose[]) => {
    await medicineService.markMultipleDosesTaken(groupDoses, todayYMD);
    triggerRefresh();
  };

  // Action: Open custom confirmation before skipping all
  const handleRequestSkipAllSlot = (groupDoses: TodayMedicineDose[], routineName: string) => {
    setSkipConfirmation({
      isOpen: true,
      doses: groupDoses,
      routineName,
      isSubmitting: false,
    });
  };

  const handleConfirmSkipAll = async () => {
    if (skipConfirmation.doses.length === 0) return;
    setSkipConfirmation((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await medicineService.markMultipleDosesSkipped(skipConfirmation.doses, todayYMD);
      triggerRefresh();
      setSkipConfirmation({ isOpen: false, doses: [], routineName: '', isSubmitting: false });
    } catch (err) {
      console.error('Error skipping doses:', err);
      setSkipConfirmation((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleCancelSkipAll = () => {
    setSkipConfirmation({ isOpen: false, doses: [], routineName: '', isSubmitting: false });
  };

  // Action: Toggle individual medicine dose
  const handleToggleDose = async (dose: TodayMedicineDose) => {
    if (dose.status === 'taken' && dose.logId) {
      await medicineService.unmarkDose(dose.logId);
    } else {
      const scheduledTime = `${todayYMD} ${dose.reminderTime}`;
      await medicineService.markDose({
        medicineId: dose.medicineId,
        scheduleId: dose.scheduleId,
        scheduledTime,
        status: 'taken',
      });
    }
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
    currentHour < 12
      ? `Good morning, ${userName}`
      : currentHour < 18
      ? `Good afternoon, ${userName}`
      : `Good evening, ${userName}`;

  const formattedHeaderDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Today's sugar average
  const daySugarAvg =
    daySugarLogs.length > 0
      ? Math.round(
          daySugarLogs.reduce((acc, curr) => acc + curr.level, 0) / daySugarLogs.length
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
        <View className="pt-3 pb-3 flex-row justify-between items-start">
          <View className="gap-1 flex-1 pr-2">
            <Text className="text-[28px] font-bold tracking-wide text-charcoal dark:text-charcoal-dark">
              {greeting}
            </Text>
            <Text className="text-base font-semibold text-umber dark:text-umber-dark">
              {formattedHeaderDate}
            </Text>
          </View>
          <ScalePressable
            onPress={() => router.push('/settings')}
            scaleTo={0.92}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
            accessibilityRole="button"
            accessibilityLabel="Open settings and display theme">
            <Ionicons name="settings-outline" size={22} color={colors.primary} />
          </ScalePressable>
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
            {/* ----------------------------------------------------------- */}
            {/* Hero Card: Next Routine Slot or Completed Status             */}
            {/* ----------------------------------------------------------- */}
            {nextPendingGroup ? (
              <View className="rounded-2xl border-2 border-sage dark:border-sage-dark bg-sage-tint dark:bg-sage-dark-tint p-4 mt-1 mb-2.5 gap-2.5 overflow-hidden">
                <View className="flex-row justify-between items-start gap-2">
                  <View className="flex-row items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                    <Ionicons name="notifications" size={14} color={colors.primary} />
                    <Text className="text-[13px] font-bold tracking-wider text-sage dark:text-sage-dark uppercase">
                      NEXT ROUTINE
                    </Text>
                    <View className="bg-sage/15 dark:bg-sage/25 px-2.5 py-0.5 rounded-xl">
                      <Text className="text-xs font-bold text-sage dark:text-sage-dark">
                        {nextPendingGroup.doses.length} {nextPendingGroup.doses.length === 1 ? 'Med' : 'Meds'}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1 shrink-0 bg-sage/10 dark:bg-sage/20 px-2.5 py-1 rounded-xl">
                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                    <Text className="text-sm font-bold text-sage dark:text-sage-dark">
                      {nextPendingGroup.formattedTime}
                    </Text>
                  </View>
                </View>

                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  Time for your {nextPendingGroup.slotTitle}
                </Text>

                {/* List of medicines to take together in this slot */}
                <View className="gap-2 my-0.5 bg-card/90 dark:bg-card-dark p-3.5 rounded-xl border border-subtle-border dark:border-subtle-border-dark">
                  {nextPendingGroup.doses.map((dose) => (
                    <View key={dose.scheduleId} className="flex-row items-center justify-between gap-2">
                      <View className="flex-row items-center gap-2 flex-1 min-w-0 pr-1">
                        <View className="w-2.5 h-2.5 rounded-full bg-sage shrink-0" />
                        <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark flex-1" numberOfLines={1}>
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
                    label={
                      nextPendingGroup.doses.length === 1
                        ? 'Take Medicine Now'
                        : `Take All ${nextPendingGroup.doses.length} Medicines Now`
                    }
                    icon={<Ionicons name="checkmark-done-sharp" size={22} color="#FFFFFF" />}
                    variant="primary"
                    onPress={() => handleTakeAllSlot(nextPendingGroup.doses)}
                    className="min-h-[48px]"
                  />
                </View>
              </View>
            ) : totalMeds > 0 ? (
              <View className="flex-row items-center gap-3.5 rounded-2xl border-[1.5px] border-herbal dark:border-herbal-dark bg-herbal-tint dark:bg-herbal-dark-tint p-4 mt-1 mb-2.5">
                <Ionicons name="checkmark-done-circle" size={36} color={colors.success} />
                <View className="flex-1 gap-0.5">
                  <Text className="text-lg font-bold text-herbal dark:text-herbal-dark">
                    All medicines completed!
                  </Text>
                  <Text className="text-sm font-medium leading-5 text-umber dark:text-umber-dark">
                    Wonderful job today, {userName}. Rest easy and stay hydrated.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ----------------------------------------------------------- */}
            {/* Grouped Medicine Cards Section (Single Card per Routine)     */}
            {/* ----------------------------------------------------------- */}
            <SectionHeader
              title="Today's Medicines"
              subtitle={totalMeds > 0 ? `${completedMeds} of ${totalMeds} taken` : undefined}
            />

            {slotGroups.length === 0 ? (
              <EmptyState
                iconName="pill"
                title="No medicines scheduled for today"
                description="Your daily maintenance medicines appear here automatically on their scheduled days."
                actionLabel="Manage Cabinet"
                onAction={() => router.push('/explore')}
              />
            ) : (
              slotGroups.map((group) => (
                <MedicineGroupCard
                  key={group.id}
                  group={group}
                  selectedDateYMD={todayYMD}
                  isToday={true}
                  onTakeAll={handleTakeAllSlot}
                  onSkipAll={handleRequestSkipAllSlot}
                  onToggleDose={handleToggleDose}
                />
              ))
            )}

            {/* ----------------------------------------------------------- */}
            {/* Blood Sugar Section for Today                                */}
            {/* ----------------------------------------------------------- */}
            <SectionHeader
              title="Today's Blood Sugar"
              subtitle={
                daySugarAvg !== null
                  ? `Average: ${daySugarAvg} mg/dL (${daySugarLogs.length} logged)`
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

            {daySugarLogs.length === 0 ? (
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
                {daySugarLogs.map((log) => {
                  const category = getSugarCategory(log.level, log.context);
                  const style = getSugarCategoryStyle(category);
                  const dateObj = new Date(log.loggedAt);
                  const formattedTime = formatTo12Hour(dateObj);

                  return (
                    <ScalePressable
                      key={log.id}
                      onPress={() => handleOpenEditSugar(log)}
                      scaleTo={0.98}
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
                          <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                        </View>
                      </View>
                    </ScalePressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add / Edit Sugar Modal */}
      <AddEditSugarModal
        visible={isSugarModalOpen}
        initialLog={selectedSugarLog}
        onClose={() => setIsSugarModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />

      {/* Simple Confirmation Dialog for Skip All */}
      <ConfirmationDialog
        visible={skipConfirmation.isOpen}
        title="Skip this routine?"
        message={`Skip taking ${
          skipConfirmation.doses.length === 1
            ? 'this medicine'
            : `these ${skipConfirmation.doses.length} medicines`
        } for ${skipConfirmation.routineName || 'this routine'} today?`}
        confirmLabel="Skip All"
        cancelLabel="Cancel"
        variant="warning"
        isSubmitting={skipConfirmation.isSubmitting}
        onConfirm={handleConfirmSkipAll}
        onCancel={handleCancelSkipAll}
      />
    </SafeAreaView>
  );
}
