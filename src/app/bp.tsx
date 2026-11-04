import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  View,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { bloodPressureService, BPReminderConfig } from '@/services/blood-pressure.service';
import { BloodPressureLog } from '@/types';
import {
  SectionHeader,
  EmptyState,
  PrimaryButton,
  ScrollableTimePickerModal,
  BPSkeleton,
  HealthBarGraph,
  PaginationControls,
  ScalePressable,
} from '@/components/ui';
import { AddEditBPModal } from '@/components/add-edit-bp-modal';
import { ExportReportModal } from '@/components/export-report-modal';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 10;

export default function BloodPressureScreen() {
  const router = useRouter();
  const colors = useTheme();
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [reminders, setReminders] = useState<BPReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BloodPressureLog | null>(null);
  const [timePickerSlot, setTimePickerSlot] = useState<'morning' | 'evening' | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const [data, bpReminders] = await Promise.all([
        bloodPressureService.getAllLogs(),
        bloodPressureService.getBPReminders(),
      ]);
      setLogs(data);
      setReminders(bpReminders);
    } catch (err) {
      console.error('Error loading blood pressure logs:', err);
      setError("We couldn't load blood pressure records. Please try again.");
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
    setCurrentPage(1);
    loadData();
  };

  const handleToggleReminder = async (id: 'morning' | 'evening', enabled: boolean) => {
    const existing = reminders.find((r) => r.id === id);
    if (!existing) return;
    await bloodPressureService.saveBPReminder(id, existing.reminderTime, enabled, existing.label);
    const updated = await bloodPressureService.getBPReminders();
    setReminders(updated);
  };

  const handleUpdateTime = async (new12HourTime: string) => {
    if (!timePickerSlot) return;
    const canonicalTime = parseTo24Hour(new12HourTime);
    const existing = reminders.find((r) => r.id === timePickerSlot);
    if (!existing) return;
    await bloodPressureService.saveBPReminder(
      timePickerSlot,
      canonicalTime,
      existing.enabled,
      existing.label
    );
    const updated = await bloodPressureService.getBPReminders();
    setReminders(updated);
    setTimePickerSlot(null);
  };

  const handleOpenAdd = () => {
    setSelectedLog(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: BloodPressureLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const latestLog = logs[0] || null;
  const latestCategory = latestLog ? getBPCategory(latestLog.systolic, latestLog.diastolic) : null;
  const latestStyle = latestCategory ? getBPCategoryStyle(latestCategory) : null;

  const totalPages = Math.ceil(logs.length / PAGE_SIZE) || 1;
  const paginatedLogs = logs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        {/* Header & Settings Button */}
        <View className="pt-3 pb-3 flex-row justify-between items-start">
          <View className="gap-1 flex-1 pr-2">
            <Text className="text-[28px] font-bold text-charcoal dark:text-charcoal-dark">
              Blood Pressure
            </Text>
            <Text className="text-base font-semibold text-umber dark:text-umber-dark">
              Track daily systolic and diastolic pressure for Mom.
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Export PDF Button */}
            <ScalePressable
              onPress={() => setIsExportModalOpen(true)}
              scaleTo={0.92}
              className="min-h-[44px] px-3 flex-row items-center gap-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
              accessibilityRole="button"
              accessibilityLabel="Export blood pressure log as PDF">
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              <Text className="text-xs font-bold text-sage dark:text-sage-dark">Export PDF</Text>
            </ScalePressable>

            {/* Settings Button */}
            <ScalePressable
              onPress={() => router.push('/settings')}
              scaleTo={0.92}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
              accessibilityRole="button"
              accessibilityLabel="Open settings and display theme">
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </ScalePressable>
          </View>
        </View>

        {loading ? (
          <BPSkeleton />
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
            {/* -------------------------------------------------------------- */}
            {/* Interactive Bar Graph with Timeframes & Weekly/Monthly Averages */}
            {/* -------------------------------------------------------------- */}
            <HealthBarGraph
              type="bp"
              bpLogs={logs}
              title="Blood Pressure Trends"
            />

            {/* Daily BP Reminders Card */}
            <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 my-2 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View className="w-10 h-10 rounded-xl bg-terracotta-tint dark:bg-terracotta-dark-tint border border-terracotta/20 dark:border-terracotta-dark/20 items-center justify-center">
                    <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                      BP Check Reminders
                    </Text>
                    <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                      Gentle reminders notify Mom to rest and record
                    </Text>
                  </View>
                </View>
              </View>

              <View className="gap-2 pt-1">
                {reminders.map((rem) => {
                  const isMorning = rem.id === 'morning';
                  const formattedTime = formatTo12Hour(rem.reminderTime);
                  return (
                    <View
                      key={rem.id}
                      className="flex-row items-center justify-between p-3.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <Ionicons
                          name={isMorning ? 'sunny-outline' : 'moon-outline'}
                          size={22}
                          color={isMorning ? colors.warning : colors.primary}
                        />
                        <View>
                          <Text className="text-[15px] font-bold text-charcoal dark:text-charcoal-dark">
                            {isMorning ? 'Morning Check' : 'Evening Check'}
                          </Text>
                          <ScalePressable
                            onPress={() => setTimePickerSlot(rem.id)}
                            scaleTo={0.92}
                            className="min-h-[44px] flex-row items-center gap-1.5 py-1 px-1 rounded-lg"
                            accessibilityRole="button"
                            accessibilityLabel={`Change ${rem.label} time, currently ${formattedTime}`}>
                            <Ionicons name="time-outline" size={16} color={colors.primary} />
                            <Text className="text-sm font-bold text-sage dark:text-sage-dark underline">
                              {formattedTime}
                            </Text>
                          </ScalePressable>
                        </View>
                      </View>
                      <Switch
                        value={rem.enabled}
                        onValueChange={(val) => handleToggleReminder(rem.id, val)}
                        trackColor={{ false: '#DDD7CD', true: colors.primary }}
                        thumbColor={rem.enabled ? '#FFFFFF' : '#FAF7F2'}
                        accessibilityLabel={`Toggle ${rem.label}`}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Latest Reading Card */}
            {latestLog && latestStyle ? (
              <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 my-2 gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons name="heart-pulse" size={22} color={colors.primary} />
                    <Text className="text-sm font-bold text-umber dark:text-umber-dark uppercase tracking-wider">
                      Latest Reading
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1.5 rounded-xl border ${latestStyle.badgeBg} ${latestStyle.badgeBorder}`}>
                    <Text className={`text-xs font-bold ${latestStyle.textColor}`}>
                      {latestStyle.label}
                    </Text>
                  </View>
                </View>

                {/* Big BP Display */}
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-[38px] font-bold text-charcoal dark:text-charcoal-dark leading-[44px]">
                    {latestLog.systolic}/{latestLog.diastolic}
                  </Text>
                  <Text className="text-base font-semibold text-umber dark:text-umber-dark">
                    mmHg
                  </Text>
                </View>

                {/* Details Footer */}
                <View className="flex-row items-center justify-between pt-1 border-t border-subtle-border dark:border-subtle-border-dark">
                  <View className="flex-row items-center gap-3">
                    {latestLog.pulse ? (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="pulse" size={16} color={colors.textSecondary} />
                        <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                          {latestLog.pulse} bpm
                        </Text>
                      </View>
                    ) : null}
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                        {formatTo12Hour(new Date(latestLog.loggedAt))}
                      </Text>
                    </View>
                  </View>
                  <ScalePressable
                    onPress={() => handleOpenEdit(latestLog)}
                    scaleTo={0.92}
                    className="min-h-[44px] min-w-[64px] flex-row items-center justify-center gap-1 py-1 px-3 rounded-xl active:bg-surface dark:active:bg-surface-dark"
                    accessibilityRole="button"
                    accessibilityLabel="Edit latest reading">
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                    <Text className="text-sm font-bold text-sage dark:text-sage-dark">Edit</Text>
                  </ScalePressable>
                </View>
              </View>
            ) : null}

            {/* Section Header */}
            <SectionHeader
              title="Reading History"
              subtitle={logs.length > 0 ? `${logs.length} record${logs.length === 1 ? '' : 's'}` : undefined}
              rightElement={
                <PrimaryButton
                  label="Log Reading"
                  icon={<Ionicons name="add-sharp" size={21} color={colors.primary} />}
                  variant="outline"
                  onPress={handleOpenAdd}
                  className="min-h-[44px] px-4"
                />
              }
            />

            {logs.length === 0 ? (
              <EmptyState
                iconName="heart-pulse"
                title="No Blood Pressure Readings Yet"
                description="Regularly checking systolic and diastolic numbers helps keep Mom healthy and rested."
                actionLabel="Record First Reading"
                onAction={handleOpenAdd}
              />
            ) : (
              <View className="gap-2.5">
                {paginatedLogs.map((log) => {
                  const category = getBPCategory(log.systolic, log.diastolic);
                  const style = getBPCategoryStyle(category);
                  const dateObj = new Date(log.loggedAt);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  const formattedTime = formatTo12Hour(dateObj);

                  return (
                    <ScalePressable
                      key={log.id}
                      onPress={() => handleOpenEdit(log)}
                      scaleTo={0.98}
                      className="min-h-[64px] rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 gap-2.5 active:bg-card-selected"
                      accessibilityRole="button"
                      accessibilityLabel={`Reading ${log.systolic} over ${log.diastolic} mmHg on ${formattedDate}. Tap to edit.`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-baseline gap-2">
                          <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark">
                            {log.systolic}/{log.diastolic}
                          </Text>
                          <Text className="text-xs font-bold text-umber dark:text-umber-dark">
                            mmHg
                          </Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-xl border ${style.badgeBg} ${style.badgeBorder}`}>
                          <Text className={`text-xs font-bold ${style.textColor}`}>
                            {style.label}
                          </Text>
                        </View>
                      </View>

                      {/* Meta row: Pulse, Arm, Date/Time */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2.5 flex-wrap">
                          <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                            {formattedDate} at {formattedTime}
                          </Text>
                          {log.arm ? (
                            <Text className="text-sm font-semibold text-umber dark:text-umber-dark capitalize">
                              ({log.arm} arm)
                            </Text>
                          ) : null}
                          {log.pulse ? (
                            <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                              · {log.pulse} bpm
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                      </View>

                      {log.notes ? (
                        <Text className="text-sm text-charcoal dark:text-charcoal-dark bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-subtle-border dark:border-subtle-border-dark mt-0.5">
                          Note: {log.notes}
                        </Text>
                      ) : null}
                    </ScalePressable>
                  );
                })}

                {/* Pagination Controls */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={logs.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add / Edit BP Modal */}
      <AddEditBPModal
        visible={isModalOpen}
        initialLog={selectedLog}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />

      {/* Scrollable Time Picker for BP Reminder */}
      <ScrollableTimePickerModal
        visible={timePickerSlot !== null}
        value={
          timePickerSlot
            ? formatTo12Hour(
                reminders.find((r) => r.id === timePickerSlot)?.reminderTime || '08:00'
              )
            : '8:00 AM'
        }
        onClose={() => setTimePickerSlot(null)}
        onConfirm={handleUpdateTime}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType="bp"
      />
    </SafeAreaView>
  );
}
