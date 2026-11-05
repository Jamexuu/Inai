import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useIsFocused } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { bloodSugarService, SugarReminderConfig } from '@/services/blood-sugar.service';
import { BloodSugarLog } from '@/types';
import {
  SectionHeader,
  EmptyState,
  PrimaryButton,
  SugarSkeleton,
  HealthBarGraph,
  PaginationControls,
  ScalePressable,
  ScrollableTimePickerModal,
} from '@/components/ui';
import { AddEditSugarModal } from '@/components/add-edit-sugar-modal';
import { ExportReportModal } from '@/components/export-report-modal';
import { AddHealthReminderModal } from '@/components/add-health-reminder-modal';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import {
  getSugarCategory,
  getSugarCategoryStyle,
  getSugarContextLabel,
} from '@/utils/sugar.utils';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 10;

export default function SugarScreen() {
  const router = useRouter();
  const colors = useTheme();
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [logs, setLogs] = useState<BloodSugarLog[]>([]);
  const [reminders, setReminders] = useState<SugarReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Time picker & reminder modals
  const [timePickerSlot, setTimePickerSlot] = useState<string | null>(null);
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<SugarReminderConfig | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BloodSugarLog | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const isFocused = useIsFocused();

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const data = await bloodSugarService.getAllLogs();
      const sugarReminders = await bloodSugarService.getSugarReminders();
      setLogs(data);
      setReminders(sugarReminders);
    } catch (err) {
      console.error('Error loading blood sugar logs:', err);
      setError("We couldn't load blood sugar records. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDatabaseReady]);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [loadData, refreshTrigger, isDatabaseReady, isFocused]);

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadData();
  };

  const handleToggleReminder = async (id: string, enabled: boolean) => {
    const existing = reminders.find((r) => r.id === id);
    if (!existing) return;
    await bloodSugarService.saveSugarReminder(id, existing.reminderTime, enabled, existing.label);
    const updated = await bloodSugarService.getSugarReminders();
    setReminders(updated);
  };

  const handleUpdateTime = async (new12HourTime: string) => {
    if (!timePickerSlot) return;
    const canonicalTime = parseTo24Hour(new12HourTime);
    const existing = reminders.find((r) => r.id === timePickerSlot);
    if (!existing) return;
    await bloodSugarService.saveSugarReminder(
      timePickerSlot,
      canonicalTime,
      existing.enabled,
      existing.label
    );
    const updated = await bloodSugarService.getSugarReminders();
    setReminders(updated);
    setTimePickerSlot(null);
  };

  const handleSaveReminder = async (label: string, reminderTime: string, id?: string) => {
    try {
      if (id) {
        const existing = reminders.find((r) => r.id === id);
        await bloodSugarService.saveSugarReminder(id, reminderTime, existing ? existing.enabled : true, label);
      } else {
        await bloodSugarService.addSugarReminder(label, reminderTime);
      }
      const updated = await bloodSugarService.getSugarReminders();
      setReminders(updated);
    } catch (e) {
      console.warn('Failed to save Sugar reminder:', e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await bloodSugarService.deleteSugarReminder(id);
      const updated = await bloodSugarService.getSugarReminders();
      setReminders(updated);
    } catch (e) {
      console.warn('Failed to delete Sugar reminder:', e);
    }
  };

  const handleOpenAdd = () => {
    setSelectedLog(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: BloodSugarLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  const latestLog = logs[0] || null;
  const latestCategory = latestLog ? getSugarCategory(latestLog.level, latestLog.context) : null;
  const latestStyle = latestCategory ? getSugarCategoryStyle(latestCategory) : null;

  // Pagination calculations
  const totalPages = Math.ceil(logs.length / PAGE_SIZE) || 1;
  const paginatedLogs = logs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
              Blood Sugar
            </Text>
            <Text className="text-base font-semibold text-umber dark:text-umber-dark">
              Track daily glucose and routine trends for Mom.
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Export PDF Button */}
            <ScalePressable
              onPress={() => setIsExportModalOpen(true)}
              scaleTo={0.92}
              className="min-h-[44px] px-3 flex-row items-center gap-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
              accessibilityRole="button"
              accessibilityLabel="Export blood sugar log as PDF">
              <Ionicons name="document-text-outline" size={18} color={colors.secondary} />
              <Text className="text-xs font-bold text-terracotta dark:text-terracotta-dark">Export PDF</Text>
            </ScalePressable>

            {/* Settings Button */}
            <ScalePressable
              onPress={() => router.push('/settings')}
              scaleTo={0.92}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
              accessibilityRole="button"
              accessibilityLabel="Open settings">
              <Ionicons name="settings-outline" size={22} color={colors.primary} />
            </ScalePressable>
          </View>
        </View>

        {loading ? (
          <SugarSkeleton />
        ) : (
          <>
            {/* Error Message */}
            {error ? (
              <View className="p-3 my-2 bg-brick-tint border border-brick rounded-xl">
                <Text className="text-sm font-bold text-brick">{error}</Text>
              </View>
            ) : null}

            {/* Blood Sugar Bar Graph with Today / Week / Month / Year Timeframe Tabs */}
            <HealthBarGraph
              type="sugar"
              sugarLogs={logs}
              title="Blood Sugar Trends"
            />

            {/* Quick Overview Hero Card: Latest Glucose Reading */}
            {latestLog && latestStyle ? (
              <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 my-2 gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-lg bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
                      <Ionicons name="water" size={18} color={colors.secondary} />
                    </View>
                    <Text className="text-xs font-bold tracking-wider text-umber dark:text-umber-dark uppercase">
                      Latest Glucose Reading
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-xl border ${latestStyle.badgeBg} ${latestStyle.badgeBorder}`}>
                    <Text className={`text-xs font-bold ${latestStyle.textColor}`}>
                      {latestStyle.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-baseline gap-2">
                  <Text className="text-4xl font-bold text-charcoal dark:text-charcoal-dark">
                    {latestLog.level}
                  </Text>
                  <Text className="text-base font-semibold text-umber dark:text-umber-dark">
                    mg/dL
                  </Text>
                  <Text className="text-xs font-bold text-sage dark:text-sage-dark ml-2">
                    · {getSugarContextLabel(latestLog.context)}
                  </Text>
                </View>

                <View className="pt-2 border-t border-subtle-border dark:border-subtle-border-dark flex-row justify-between items-center">
                  <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                    Logged: {new Date(latestLog.loggedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })} at {formatTo12Hour(new Date(latestLog.loggedAt))}
                  </Text>
                  <ScalePressable
                    onPress={() => handleOpenEdit(latestLog)}
                    scaleTo={0.92}
                    className="min-h-[44px] min-w-[44px] items-center justify-center -mr-2"
                    accessibilityRole="button"
                    accessibilityLabel="Edit latest reading">
                    <Ionicons name="pencil" size={16} color={colors.primary} />
                  </ScalePressable>
                </View>
              </View>
            ) : null}

            {/* Daily Sugar Reminders Card */}
            <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 my-2 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View className="w-10 h-10 rounded-xl bg-terracotta-tint dark:bg-terracotta-dark-tint border border-terracotta/20 dark:border-terracotta-dark/20 items-center justify-center">
                    <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                      Blood Sugar Reminders
                    </Text>
                    <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                      Gentle reminders for fasting and post-meal checks
                    </Text>
                  </View>
                </View>

                {/* Add Reminder Button */}
                <ScalePressable
                  onPress={() => {
                    setEditingReminder(null);
                    setIsAddReminderModalOpen(true);
                  }}
                  scaleTo={0.92}
                  className="min-h-[40px] px-3 flex-row items-center gap-1 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
                  accessibilityRole="button"
                  accessibilityLabel="Add new blood sugar reminder">
                  <Ionicons name="add" size={18} color={colors.primary} />
                  <Text className="text-xs font-bold text-sage dark:text-sage-dark">Add</Text>
                </ScalePressable>
              </View>

              <View className="gap-2 pt-1">
                {reminders.map((rem) => {
                  const isMorning =
                    rem.label.toLowerCase().includes('morning') ||
                    rem.label.toLowerCase().includes('fasting') ||
                    rem.id === 'fasting';
                  const isEvening =
                    rem.label.toLowerCase().includes('evening') ||
                    rem.label.toLowerCase().includes('dinner') ||
                    rem.label.toLowerCase().includes('bedtime') ||
                    rem.id === 'post_dinner';
                  const isLunch =
                    rem.label.toLowerCase().includes('lunch') ||
                    rem.label.toLowerCase().includes('afternoon');
                  const iconName = isMorning
                    ? 'sunny-outline'
                    : isEvening
                    ? 'moon-outline'
                    : isLunch
                    ? 'restaurant-outline'
                    : 'water-outline';
                  const iconColor = isMorning
                    ? colors.warning
                    : isEvening
                    ? colors.primary
                    : colors.secondary;
                  const formattedTime = formatTo12Hour(rem.reminderTime);

                  return (
                    <View
                      key={rem.id}
                      className="flex-row items-center justify-between p-3.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <Ionicons name={iconName} size={22} color={iconColor} />
                        <View className="flex-1">
                          <Text className="text-[15px] font-bold text-charcoal dark:text-charcoal-dark">
                            {rem.label}
                          </Text>
                          <ScalePressable
                            onPress={() => setTimePickerSlot(rem.id)}
                            scaleTo={0.92}
                            className="min-h-[36px] flex-row items-center gap-1.5 py-0.5 rounded-lg self-start"
                            accessibilityRole="button"
                            accessibilityLabel={`Change ${rem.label} time, currently ${formattedTime}`}>
                            <Ionicons name="time-outline" size={15} color={colors.primary} />
                            <Text className="text-sm font-bold text-sage dark:text-sage-dark underline">
                              {formattedTime}
                            </Text>
                          </ScalePressable>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <ScalePressable
                          onPress={() => {
                            setEditingReminder(rem);
                            setIsAddReminderModalOpen(true);
                          }}
                          scaleTo={0.9}
                          className="w-9 h-9 items-center justify-center rounded-lg bg-card dark:bg-card-dark border border-subtle-border dark:border-subtle-border-dark"
                          accessibilityRole="button"
                          accessibilityLabel={`Modify ${rem.label}`}>
                          <Ionicons name="pencil" size={15} color={colors.primary} />
                        </ScalePressable>
                        <Switch
                          value={rem.enabled}
                          onValueChange={(val) => handleToggleReminder(rem.id, val)}
                          trackColor={{ false: '#DDD7CD', true: colors.primary }}
                          thumbColor={rem.enabled ? '#FFFFFF' : '#FAF7F2'}
                          accessibilityLabel={`Toggle ${rem.label}`}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Reading History Log Section */}
            <SectionHeader
              title="Reading History"
              subtitle={
                logs.length > 0
                  ? `${logs.length} readings recorded`
                  : 'Maintain a steady glucose routine'
              }
              rightElement={
                <PrimaryButton
                  label="Log Sugar"
                  icon={<Ionicons name="add-sharp" size={21} color={colors.primary} />}
                  variant="outline"
                  onPress={handleOpenAdd}
                  className="min-h-[44px] px-4"
                />
              }
            />

            {logs.length === 0 ? (
              <EmptyState
                iconName="water-outline"
                title="No Blood Sugar Readings Yet"
                description="Log fasting or 2-hour post-meal glucose readings to track Mom's health steadily."
                actionLabel="Record First Reading"
                onAction={handleOpenAdd}
              />
            ) : (
              <View className="gap-2.5">
                {paginatedLogs.map((log) => {
                  const category = getSugarCategory(log.level, log.context);
                  const style = getSugarCategoryStyle(category);
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
                      accessibilityLabel={`Reading ${log.level} mg/dL on ${formattedDate}. Tap to edit.`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-baseline gap-2">
                          <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark">
                            {log.level}
                          </Text>
                          <Text className="text-xs font-bold text-umber dark:text-umber-dark">
                            mg/dL
                          </Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-xl border ${style.badgeBg} ${style.badgeBorder}`}>
                          <Text className={`text-xs font-bold ${style.textColor}`}>
                            {style.label}
                          </Text>
                        </View>
                      </View>

                      {/* Meta row: Context, Date, Time */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2 flex-wrap">
                          <View className="bg-surface dark:bg-surface-dark px-2 py-0.5 rounded-md border border-subtle-border dark:border-subtle-border-dark">
                            <Text className="text-xs font-semibold text-charcoal dark:text-charcoal-dark">
                              {getSugarContextLabel(log.context)}
                            </Text>
                          </View>
                          <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                            {formattedDate} at {formattedTime}
                          </Text>
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

      {/* Add / Edit Sugar Modal */}
      <AddEditSugarModal
        visible={isModalOpen}
        initialLog={selectedLog}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />

      {/* Scrollable Time Picker for Sugar Reminder */}
      <ScrollableTimePickerModal
        visible={timePickerSlot !== null}
        value={
          timePickerSlot
            ? formatTo12Hour(
                reminders.find((r) => r.id === timePickerSlot)?.reminderTime || '07:30'
              )
            : '7:30 AM'
        }
        onClose={() => setTimePickerSlot(null)}
        onConfirm={handleUpdateTime}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType="sugar"
      />

      {/* Add / Modify Reminder Modal */}
      <AddHealthReminderModal
        visible={isAddReminderModalOpen}
        type="sugar"
        initialReminder={editingReminder}
        onClose={() => {
          setIsAddReminderModalOpen(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        onDelete={handleDeleteReminder}
      />
    </SafeAreaView>
  );
}
