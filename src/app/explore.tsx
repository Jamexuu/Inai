import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app.store';
import { medicineService } from '@/services/medicine.service';
import { MedicineWithSchedules, MedicineLog } from '@/types';
import { SectionHeader, PrimaryButton, EmptyState } from '@/components/ui';
import { AddMedicineModal } from '@/components/add-medicine-modal';

export default function MedicinesScreen() {
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [medicines, setMedicines] = useState<MedicineWithSchedules[]>([]);
  const [logs, setLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    try {
      const [allMeds, recentLogs] = await Promise.all([
        medicineService.getAllMedicines(),
        medicineService.getRecentLogs(20),
      ]);
      setMedicines(allMeds);
      setLogs(recentLogs);
    } catch (err) {
      console.error('Error loading medicines list:', err);
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
    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to remove ${med.name}? Reminders for this medicine will also be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await medicineService.deleteMedicine(med.id);
            triggerRefresh();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView
        contentContainerClassName="px-4 pb-6"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Screen Header */}
        <View className="pt-3 pb-3 gap-1">
          <Text className="text-[28px] font-bold text-charcoal dark:text-charcoal-dark">
            My Medicines
          </Text>
          <Text className="text-base font-normal text-umber dark:text-umber-dark">
            All daily maintenance prescriptions and intake history.
          </Text>
        </View>

        {loading ? (
          <View className="py-16 items-center gap-3">
            <ActivityIndicator size="large" color="#3D5A50" />
            <Text className="text-base font-medium text-umber dark:text-umber-dark">
              Loading medicine cabinet...
            </Text>
          </View>
        ) : (
          <>
            {/* Action Bar */}
            <View className="my-2">
              <PrimaryButton
                label="Add New Medicine"
                icon={<Ionicons name="add" size={20} color="#FFFFFF" />}
                variant="primary"
                onPress={() => setIsAddModalOpen(true)}
              />
            </View>

            {/* Medicines List */}
            <SectionHeader
              title="Active Prescriptions"
              subtitle={`${medicines.length} medicine${medicines.length === 1 ? '' : 's'} registered`}
            />

            {medicines.length === 0 ? (
              <EmptyState
                iconName="pill"
                title="No medicines found"
                description="Keep your medicines organized with exact reminder times."
                actionLabel="Add Medicine"
                onAction={() => setIsAddModalOpen(true)}
              />
            ) : (
              medicines.map((med) => (
                <View
                  key={med.id}
                  className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 mb-3 gap-2">
                  <View className="flex-row justify-between items-start">
                    <View className="gap-0.5 flex-1">
                      <Text className="text-[22px] font-bold text-charcoal dark:text-charcoal-dark">
                        {med.name}
                      </Text>
                      <Text className="text-[17px] font-semibold text-terracotta dark:text-terracotta-dark">
                        {med.dosage}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteMedicine(med)}
                      className="min-h-[48px] justify-center px-2 active:opacity-70"
                      accessibilityLabel={`Delete ${med.name}`}>
                      <Text className="text-[15px] font-semibold text-brick dark:text-brick-dark">
                        Delete
                      </Text>
                    </Pressable>
                  </View>

                  {med.instructions ? (
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="information-circle-outline" size={16} color="#6B645D" />
                      <Text className="text-[15px] font-medium text-umber dark:text-umber-dark flex-1">
                        {med.instructions}
                      </Text>
                    </View>
                  ) : null}

                  {med.notes ? (
                    <Text className="text-sm italic text-muted-gray dark:text-muted-gray-dark">
                      Note: {med.notes}
                    </Text>
                  ) : null}

                  {/* Scheduled Times */}
                  <View className="flex-row flex-wrap items-center gap-2 mt-1">
                    <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                      Times:
                    </Text>
                    {med.schedules.map((s) => (
                      <View
                        key={s.id}
                        className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg border border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark">
                        <Ionicons name="time-outline" size={13} color="#3D5A50" />
                        <Text className="text-[13px] font-semibold text-sage dark:text-sage-dark">
                          {s.reminderTime} ({s.timeSlot})
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
              <View className="p-4 rounded-xl items-center bg-surface dark:bg-surface-dark">
                <Text className="text-[15px] text-center leading-[22px] text-umber dark:text-umber-dark">
                  No doses logged yet. As you mark medicines taken on the Home screen, they will appear here.
                </Text>
              </View>
            ) : (
              logs.slice(0, 10).map((log) => {
                const dateObj = new Date(log.loggedAt);
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                const isTaken = log.status === 'taken';

                return (
                  <View
                    key={log.id}
                    className="flex-row justify-between items-center p-3 rounded-xl border border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark mb-2">
                    <View className="flex-row items-center gap-3">
                      <Ionicons
                        name={isTaken ? 'checkmark-circle' : 'close-circle-outline'}
                        size={22}
                        color={isTaken ? '#2E684D' : '#A8631E'}
                      />
                      <View>
                        <Text className="text-base font-semibold capitalize text-charcoal dark:text-charcoal-dark">
                          Dose marked as {log.status}
                        </Text>
                        <Text className="text-sm text-umber dark:text-umber-dark">
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

      {/* Add Medicine Modal */}
      <AddMedicineModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => triggerRefresh()}
      />
    </SafeAreaView>
  );
}
