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
import { useAppStore } from '@/store/app.store';
import { bloodPressureService, BPReminderConfig } from '@/services/blood-pressure.service';
import { BloodPressureLog } from '@/types';
import {
  SectionHeader,
  EmptyState,
  PrimaryButton,
  ScrollableTimePickerModal,
  BPSkeleton,
} from '@/components/ui';
import { AddEditBPModal } from '@/components/add-edit-bp-modal';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';

export default function BloodPressureScreen() {
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [reminders, setReminders] = useState<BPReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BloodPressureLog | null>(null);
  const [timePickerSlot, setTimePickerSlot] = useState<'morning' | 'evening' | null>(null);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    try {
      const [data, bpReminders] = await Promise.all([
        bloodPressureService.getAllLogs(),
        bloodPressureService.getBPReminders(),
      ]);
      setLogs(data);
      setReminders(bpReminders);
    } catch (err) {
      console.error('Error loading blood pressure logs:', err);
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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Header */}
        <View className="pt-3 pb-3 gap-1">
          <Text className="text-[28px] font-bold text-charcoal">
            Blood Pressure
          </Text>
          <Text className="text-base font-normal text-umber">
            Track daily systolic and diastolic pressure for Mom.
          </Text>
        </View>

        {loading ? (
          <BPSkeleton />
        ) : (
          <>
            {/* Daily BP Alarms Card */}
            <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 my-2 gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View className="w-9 h-9 rounded-xl bg-terracotta/10 border border-terracotta/20 items-center justify-center">
                    <Ionicons name="alarm-outline" size={20} color="#C46849" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-charcoal">
                      BP Check Reminders
                    </Text>
                    <Text className="text-xs text-umber">
                      Loud alarms remind Mom to rest & record
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
                      className="flex-row items-center justify-between p-3 rounded-xl bg-surface border border-subtle-border">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <Ionicons
                          name={isMorning ? 'sunny-outline' : 'moon-outline'}
                          size={20}
                          color={isMorning ? '#A8631E' : '#3D5A50'}
                        />
                        <View>
                          <Text className="text-[15px] font-bold text-charcoal">
                            {isMorning ? 'Morning Check' : 'Evening Check'}
                          </Text>
                          <Pressable
                            onPress={() => setTimePickerSlot(rem.id)}
                            className="flex-row items-center gap-1 mt-0.5"
                            accessibilityRole="button"
                            accessibilityLabel={`Change ${rem.label} time`}>
                            <Ionicons name="time-outline" size={14} color="#3D5A50" />
                            <Text className="text-sm font-bold text-sage underline">
                              {formattedTime}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                      <Switch
                        value={rem.enabled}
                        onValueChange={(val) => handleToggleReminder(rem.id, val)}
                        trackColor={{ false: '#DDD7CD', true: '#3D5A50' }}
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
              <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 my-2 gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <MaterialCommunityIcons name="heart-pulse" size={20} color="#3D5A50" />
                    <Text className="text-sm font-bold text-umber uppercase tracking-wider">
                      Latest Reading
                    </Text>
                  </View>
                  <View
                    className={`px-3 py-1 rounded-full border ${latestStyle.badgeBg} ${latestStyle.badgeBorder}`}>
                    <Text className={`text-xs font-bold ${latestStyle.textColor}`}>
                      {latestStyle.label}
                    </Text>
                  </View>
                </View>

                {/* Big BP Display */}
                <View className="flex-row items-baseline gap-2">
                  <Text className="text-[38px] font-bold text-charcoal leading-[44px]">
                    {latestLog.systolic}/{latestLog.diastolic}
                  </Text>
                  <Text className="text-base font-semibold text-umber">
                    mmHg
                  </Text>
                </View>

                {/* Details Footer */}
                <View className="flex-row items-center justify-between pt-1 border-t border-subtle-border">
                  <View className="flex-row items-center gap-3">
                    {latestLog.pulse ? (
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="pulse" size={15} color="#6B645D" />
                        <Text className="text-sm font-medium text-umber">
                          {latestLog.pulse} bpm
                        </Text>
                      </View>
                    ) : null}
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time-outline" size={15} color="#6B645D" />
                      <Text className="text-sm font-medium text-umber">
                        {formatTo12Hour(new Date(latestLog.loggedAt))}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleOpenEdit(latestLog)}
                    className="flex-row items-center gap-1 py-1 px-2.5 rounded-lg active:bg-surface"
                    accessibilityRole="button"
                    accessibilityLabel="Edit latest reading">
                    <Ionicons name="pencil-outline" size={15} color="#3D5A50" />
                    <Text className="text-xs font-bold text-sage">Edit</Text>
                  </Pressable>
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
                  icon={<Ionicons name="add" size={18} color="#3D5A50" />}
                  variant="outline"
                  onPress={handleOpenAdd}
                  className="min-h-[40px] px-3.5"
                />
              }
            />

            {logs.length === 0 ? (
              <EmptyState
                iconName="heart-pulse"
                title="No blood pressure logs yet"
                description="Regularly checking blood pressure helps maintain Mom's health and routine."
                actionLabel="Log Blood Pressure"
                onAction={handleOpenAdd}
              />
            ) : (
              <View className="gap-2.5">
                {logs.map((log) => {
                  const category = getBPCategory(log.systolic, log.diastolic);
                  const style = getBPCategoryStyle(category);
                  const dateObj = new Date(log.loggedAt);
                  const formattedDate = dateObj.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  });
                  const formattedTime = formatTo12Hour(dateObj);

                  return (
                    <Pressable
                      key={log.id}
                      onPress={() => handleOpenEdit(log)}
                      className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-3.5 gap-2 active:bg-card-selected"
                      accessibilityRole="button"
                      accessibilityLabel={`Reading ${log.systolic} over ${log.diastolic} mmHg on ${formattedDate}. Tap to edit.`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-baseline gap-2">
                          <Text className="text-2xl font-bold text-charcoal">
                            {log.systolic}/{log.diastolic}
                          </Text>
                          <Text className="text-xs font-semibold text-umber">
                            mmHg
                          </Text>
                        </View>
                        <View
                          className={`px-2.5 py-1 rounded-full border ${style.badgeBg} ${style.badgeBorder}`}>
                          <Text className={`text-xs font-bold ${style.textColor}`}>
                            {style.label}
                          </Text>
                        </View>
                      </View>

                      {/* Meta row: Pulse, Arm, Date/Time */}
                      <View className="flex-row items-center justify-between text-xs text-umber">
                        <View className="flex-row items-center gap-3">
                          <Text className="text-xs text-umber">
                            {formattedDate} at {formattedTime}
                          </Text>
                          {log.arm ? (
                            <Text className="text-xs text-umber capitalize">
                              · {log.arm} arm
                            </Text>
                          ) : null}
                          {log.pulse ? (
                            <Text className="text-xs text-umber">
                              · {log.pulse} bpm
                            </Text>
                          ) : null}
                        </View>
                        <Ionicons name="pencil-outline" size={16} color="#6B645D" />
                      </View>

                      {log.notes ? (
                        <Text className="text-xs text-umber bg-surface px-2.5 py-1.5 rounded-lg mt-0.5">
                          Note: {log.notes}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
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
    </SafeAreaView>
  );
}

