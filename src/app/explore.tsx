import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { medicineService } from '@/services/medicine.service';
import { MedicineWithSchedules, MedicineLog } from '@/types';
import {
  SectionHeader,
  PrimaryButton,
  EmptyState,
  MedicinesSkeleton,
  ConfirmationDialog,
  ScalePressable,
} from '@/components/ui';
import { AddMedicineModal } from '@/components/add-medicine-modal';
import { formatTo12Hour, formatDaysOfWeekSummary } from '@/utils/date.utils';
import { useTheme } from '@/hooks/use-theme';

export default function MedicinesScreen() {
  const router = useRouter();
  const colors = useTheme();
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [medicines, setMedicines] = useState<MedicineWithSchedules[]>([]);
  const [logs, setLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicineForEdit, setSelectedMedicineForEdit] = useState<MedicineWithSchedules | null>(null);
  const [medicineToDelete, setMedicineToDelete] = useState<MedicineWithSchedules | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const [allMeds, recentLogs] = await Promise.all([
        medicineService.getAllMedicines(),
        medicineService.getRecentLogs(20),
      ]);
      setMedicines(allMeds);
      setLogs(recentLogs);
    } catch (err) {
      console.error('Error loading medicines list:', err);
      setError("We couldn't load your medicines list. Please try again.");
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

  const handleDeleteMedicine = (med: MedicineWithSchedules) => {
    setMedicineToDelete(med);
  };

  const handleConfirmDeleteMedicine = async () => {
    if (!medicineToDelete) return;
    setIsDeleting(true);
    try {
      await medicineService.deleteMedicine(medicineToDelete.id);
      triggerRefresh();
      setMedicineToDelete(null);
    } catch (err) {
      console.error('Error deleting medicine:', err);
    } finally {
      setIsDeleting(false);
    }
  };

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
        {/* Screen Header & Settings Button */}
        <View className="pt-3 pb-3 flex-row justify-between items-start">
          <View className="gap-1 flex-1 pr-2">
            <Text className="text-[28px] font-bold text-charcoal dark:text-charcoal-dark">
              Daily Medicines
            </Text>
            <Text className="text-base font-semibold text-umber dark:text-umber-dark">
              All registered prescriptions and recent intake records for Mom.
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
          <MedicinesSkeleton />
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
            {/* Action Bar */}
            <View className="my-1">
              <PrimaryButton
                label="Add New Medicine"
                icon={<Ionicons name="add-sharp" size={22} color="#FFFFFF" />}
                variant="primary"
                onPress={() => {
                  setSelectedMedicineForEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="min-h-[50px]"
              />
            </View>

            {/* Medicines List */}
            <SectionHeader
              title="Registered Medicines"
              subtitle={`${medicines.length} medicine${medicines.length === 1 ? '' : 's'} registered`}
            />

            {medicines.length === 0 ? (
              <EmptyState
                iconName="pill"
                title="Your Medicine Cabinet is Empty"
                description="Keep daily medicines organized with dosages and reminder times for Mom."
                actionLabel="Add First Medicine"
                onAction={() => {
                  setSelectedMedicineForEdit(null);
                  setIsAddModalOpen(true);
                }}
              />
            ) : (
              medicines.map((med) => (
                <View
                  key={med.id}
                  className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 mb-3 gap-2.5">
                  <View className="flex-row justify-between items-start">
                    <View className="gap-0.5 flex-1 pr-2">
                      <Text className="text-[22px] font-bold text-charcoal dark:text-charcoal-dark">
                        {med.name}
                      </Text>
                      <Text className="text-[17px] font-bold text-terracotta dark:text-terracotta-dark">
                        {med.dosage}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <ScalePressable
                        onPress={() => {
                          setSelectedMedicineForEdit(med);
                          setIsAddModalOpen(true);
                        }}
                        scaleTo={0.93}
                        className="min-h-[44px] min-w-[64px] px-3 py-2 flex-row items-center justify-center gap-1 rounded-xl active:bg-surface dark:active:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark"
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${med.name}`}>
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                        <Text className="text-[14px] font-bold text-sage dark:text-sage-dark">
                          Edit
                        </Text>
                      </ScalePressable>
                      <ScalePressable
                        onPress={() => handleDeleteMedicine(med)}
                        scaleTo={0.93}
                        className="min-h-[44px] min-w-[64px] px-3 py-2 flex-row items-center justify-center gap-1 rounded-xl active:bg-brick-tint/40 border border-brick/30 dark:border-brick-dark/30"
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${med.name}`}>
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                        <Text className="text-[14px] font-bold text-brick dark:text-brick-dark">
                          Delete
                        </Text>
                      </ScalePressable>
                    </View>
                  </View>

                  {med.instructions ? (
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                      <Text className="text-[15px] font-medium text-umber dark:text-umber-dark flex-1">
                        {med.instructions}
                      </Text>
                    </View>
                  ) : null}

                  {med.notes ? (
                    <Text className="text-sm font-medium text-umber dark:text-umber-dark bg-surface dark:bg-surface-dark px-3 py-1.5 rounded-lg border border-subtle-border dark:border-subtle-border-dark">
                      Note: {med.notes}
                    </Text>
                  ) : null}

                  {/* Scheduled Times */}
                  <View className="flex-row flex-wrap items-center gap-2 mt-1">
                    <Text className="text-sm font-bold text-umber dark:text-umber-dark">
                      Times:
                    </Text>
                    {med.schedules.map((s) => (
                      <View
                        key={s.id}
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark">
                        <Ionicons name="time-outline" size={14} color={colors.primary} />
                        <Text className="text-[13px] font-bold text-sage dark:text-sage-dark">
                          {formatTo12Hour(s.reminderTime)} ({s.timeSlot.charAt(0).toUpperCase() + s.timeSlot.slice(1)})
                        </Text>
                        <Text className="text-[12px] font-medium text-umber dark:text-umber-dark">
                          • {formatDaysOfWeekSummary(s.daysOfWeek)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}

            {/* Recent History Section */}
            <SectionHeader
              title="Recent Intake History"
              subtitle="Latest recorded doses"
            />

            {logs.length === 0 ? (
              <View className="p-4 rounded-2xl items-center bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark">
                <Text className="text-[15px] font-medium text-center leading-[22px] text-umber dark:text-umber-dark">
                  No doses logged yet. As you mark medicines taken on the Today screen, they will appear here.
                </Text>
              </View>
            ) : (
              logs.slice(0, 10).map((log) => {
                const dateObj = new Date(log.loggedAt);
                const timeStr = formatTo12Hour(dateObj);
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const isTaken = log.status === 'taken';

                return (
                  <View
                    key={log.id}
                    className="flex-row justify-between items-center p-3.5 rounded-2xl border border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark mb-2.5">
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name={isTaken ? 'checkmark-circle' : 'close-circle-outline'}
                        size={22}
                        color={isTaken ? colors.success : colors.warning}
                      />
                      <View>
                        <Text className="text-base font-bold capitalize text-charcoal dark:text-charcoal-dark">
                          Dose marked as {log.status}
                        </Text>
                        <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                          {dateStr} at {timeStr}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Add / Edit Medicine Modal */}
      <AddMedicineModal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedMedicineForEdit(null);
        }}
        onSuccess={() => triggerRefresh()}
        initialMedicine={selectedMedicineForEdit}
      />

      {/* Simple Confirmation Modal for Removing Medicine */}
      <ConfirmationDialog
        visible={!!medicineToDelete}
        title="Remove medicine?"
        message={`Remove ${medicineToDelete?.name} from your cabinet? Reminders will also be cancelled.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDeleteMedicine}
        onCancel={() => setMedicineToDelete(null)}
      />
    </SafeAreaView>
  );
}
