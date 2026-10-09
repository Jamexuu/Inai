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
import { useAppStore } from '@/store/app.store';
import { medicineService } from '@/services/medicine.service';
import { mealService } from '@/services/meal.service';
import { bloodPressureService } from '@/services/blood-pressure.service';
import {
  MedicineWithSchedules,
  MedicineDoseStatus,
  MealStatus,
} from '@/types';
import {
  StatusBadge,
  SectionHeader,
  EmptyState,
  HistorySkeleton,
} from '@/components/ui';
import { formatTo12Hour } from '@/utils/date.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';

type FilterType = 'all' | 'medicines' | 'meals' | 'bp';

interface UnifiedHistoryItem {
  id: string;
  type: 'medicine' | 'meal' | 'bp';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: MedicineDoseStatus | MealStatus;
  bpBadge?: { label: string; bg: string; border: string; text: string };
  notes?: string;
}

export default function HistoryScreen() {
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);

  const [filter, setFilter] = useState<FilterType>('all');
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    try {
      const [allMeds, medLogs, mealLogs, bpLogs] = await Promise.all([
        medicineService.getAllMedicines(),
        medicineService.getRecentLogs(50),
        mealService.getRecentLogs(50),
        bloodPressureService.getAllLogs(),
      ]);

      const medMap = new Map<string, MedicineWithSchedules>();
      allMeds.forEach((m) => medMap.set(m.id, m));

      const unified: UnifiedHistoryItem[] = [];

      // 1. Medicine logs
      medLogs.forEach((log) => {
        const med = medMap.get(log.medicineId);
        const name = med ? med.name : 'Prescription';
        const dosage = med ? ` (${med.dosage})` : '';

        const dateObj = new Date(log.loggedAt || log.scheduledTime);
        const timeFormatted = formatTo12Hour(dateObj);
        const dateFormatted = dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        unified.push({
          id: `med_${log.id}`,
          type: 'medicine',
          title: `${name}${dosage}`,
          subtitle: `${dateFormatted} at ${timeFormatted}`,
          timestamp: log.loggedAt || log.scheduledTime,
          status: log.status,
          notes: log.notes,
        });
      });

      // 2. Meal logs
      mealLogs.forEach((log) => {
        const mealTitle =
          log.mealType.charAt(0).toUpperCase() + log.mealType.slice(1);
        const dateObj = new Date(log.loggedAt);
        const timeFormatted = formatTo12Hour(dateObj);
        const dateFormatted = dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        unified.push({
          id: `meal_${log.id}`,
          type: 'meal',
          title: `${mealTitle}`,
          subtitle: `${dateFormatted} at ${timeFormatted}`,
          timestamp: log.loggedAt,
          status: log.status === 'completed' ? 'completed' : 'skipped',
          notes: log.notes,
        });
      });

      // 3. Blood Pressure logs
      bpLogs.forEach((log) => {
        const category = getBPCategory(log.systolic, log.diastolic);
        const style = getBPCategoryStyle(category);
        const dateObj = new Date(log.loggedAt);
        const timeFormatted = formatTo12Hour(dateObj);
        const dateFormatted = dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        const pulseInfo = log.pulse ? ` · ${log.pulse} bpm` : '';

        unified.push({
          id: `bp_${log.id}`,
          type: 'bp',
          title: `${log.systolic}/${log.diastolic} mmHg`,
          subtitle: `${dateFormatted} at ${timeFormatted}${pulseInfo}`,
          timestamp: log.loggedAt,
          bpBadge: {
            label: style.label,
            bg: style.badgeBg,
            border: style.badgeBorder,
            text: style.textColor,
          },
          notes: log.notes,
        });
      });

      // Sort newest first
      unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setItems(unified);
    } catch (err) {
      console.error('Error loading history:', err);
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

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'medicines') return item.type === 'medicine';
    if (filter === 'meals') return item.type === 'meal';
    if (filter === 'bp') return item.type === 'bp';
    return true;
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView
        contentContainerClassName="px-4 pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        {/* Screen Header */}
        <View className="pt-3 pb-3 gap-1">
          <Text className="text-[28px] font-bold text-charcoal">
            Intake & Health History
          </Text>
          <Text className="text-base font-normal text-umber">
            Track your past medicine doses, meals, and blood pressure.
          </Text>
        </View>

        {/* Filter Pills */}
        <View className="flex-row flex-wrap gap-2 my-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'medicines', label: 'Medicines' },
            { key: 'meals', label: 'Meals' },
            { key: 'bp', label: 'Blood Pressure' },
          ].map((tab) => {
            const isSelected = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                onPress={() => setFilter(tab.key as FilterType)}
                className={`px-4 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-sage border-sage'
                    : 'bg-card border-card-border'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    isSelected ? 'text-white' : 'text-charcoal'
                  }`}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <HistorySkeleton />
        ) : (
          <>
            <SectionHeader
              title="Recent Records"
              subtitle={`${filteredItems.length} record${filteredItems.length === 1 ? '' : 's'}`}
            />

            {filteredItems.length === 0 ? (
              <EmptyState
                iconName="history"
                title="No history records yet"
                description="When you take doses, log meals, or record blood pressure, they will appear here."
              />
            ) : (
              <View className="gap-3">
                {filteredItems.map((item) => {
                  let iconName: 'medkit-outline' | 'restaurant-outline' | 'heart-outline' = 'medkit-outline';
                  if (item.type === 'meal') iconName = 'restaurant-outline';
                  if (item.type === 'bp') iconName = 'heart-outline';

                  return (
                    <View
                      key={item.id}
                      className="bg-card border border-card-border rounded-2xl p-4 gap-2">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                          <View className="w-8 h-8 rounded-full bg-surface items-center justify-center">
                            <Ionicons name={iconName} size={16} color="#3D5A50" />
                          </View>
                          <View className="flex-1">
                            <Text
                              numberOfLines={1}
                              className="text-base font-semibold text-charcoal">
                              {item.title}
                            </Text>
                            <Text className="text-xs text-umber">
                              {item.subtitle}
                            </Text>
                          </View>
                        </View>

                        {item.status ? (
                          <StatusBadge status={item.status} />
                        ) : item.bpBadge ? (
                          <View
                            className={`px-2.5 py-1 rounded-full border ${item.bpBadge.bg} ${item.bpBadge.border}`}>
                            <Text className={`text-xs font-bold ${item.bpBadge.text}`}>
                              {item.bpBadge.label}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {item.notes ? (
                        <Text className="text-xs text-umber bg-surface px-2.5 py-1.5 rounded-lg">
                          Note: {item.notes}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
