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
import { bloodSugarService } from '@/services/blood-sugar.service';
import { bloodPressureService } from '@/services/blood-pressure.service';
import {
  MedicineWithSchedules,
  MedicineDoseStatus,
  BloodSugarLog,
  BloodPressureLog,
} from '@/types';
import {
  StatusBadge,
  SectionHeader,
  PrimaryButton,
  EmptyState,
  HistorySkeleton,
  PaginationControls,
  ScalePressable,
} from '@/components/ui';
import { ExportReportModal } from '@/components/export-report-modal';
import { AddEditSugarModal } from '@/components/add-edit-sugar-modal';
import { AddEditBPModal } from '@/components/add-edit-bp-modal';
import { formatTo12Hour } from '@/utils/date.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';
import {
  getSugarCategory,
  getSugarCategoryStyle,
  getSugarContextLabel,
} from '@/utils/sugar.utils';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type FilterType = 'all' | 'medicines' | 'sugar' | 'bp';

interface UnifiedHistoryItem {
  id: string;
  type: 'medicine' | 'sugar' | 'bp';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: MedicineDoseStatus;
  customBadge?: { label: string; bg: string; border: string; text: string };
  notes?: string;
  rawSugarLog?: BloodSugarLog;
  rawBPLog?: BloodPressureLog;
}

const PAGE_SIZE = 10;

export default function HistoryScreen() {
  const router = useRouter();
  const colors = useTheme();
  const isDark = useColorScheme() === 'dark';
  const isDatabaseReady = useAppStore((state) => state.isDatabaseReady);
  const refreshTrigger = useAppStore((state) => state.refreshTrigger);

  const [filter, setFilter] = useState<FilterType>('all');
  const [items, setItems] = useState<UnifiedHistoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddSugarModalOpen, setIsAddSugarModalOpen] = useState(false);
  const [selectedSugarLog, setSelectedSugarLog] = useState<BloodSugarLog | null>(null);
  const [isAddBPModalOpen, setIsAddBPModalOpen] = useState(false);
  const [selectedBPLog, setSelectedBPLog] = useState<BloodPressureLog | null>(null);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const [allMeds, medLogs, sugarLogs, bpLogs] = await Promise.all([
        medicineService.getAllMedicines(),
        medicineService.getRecentLogs(100),
        bloodSugarService.getAllLogs(),
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

      // 2. Blood Sugar logs
      sugarLogs.forEach((log) => {
        const category = getSugarCategory(log.level, log.context);
        const style = getSugarCategoryStyle(category);
        const dateObj = new Date(log.loggedAt);
        const timeFormatted = formatTo12Hour(dateObj);
        const dateFormatted = dateObj.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        unified.push({
          id: `sugar_${log.id}`,
          type: 'sugar',
          title: `${log.level} mg/dL`,
          subtitle: `${dateFormatted} at ${timeFormatted} · ${getSugarContextLabel(log.context)}`,
          timestamp: log.loggedAt,
          customBadge: {
            label: style.label,
            bg: style.badgeBg,
            border: style.badgeBorder,
            text: style.textColor,
          },
          notes: log.notes,
          rawSugarLog: log,
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
          customBadge: {
            label: style.label,
            bg: style.badgeBg,
            border: style.badgeBorder,
            text: style.textColor,
          },
          notes: log.notes,
          rawBPLog: log,
        });
      });

      // Sort newest first
      unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setItems(unified);
    } catch (err) {
      console.error('Failed to load history logs:', err);
      setError('Could not load history. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDatabaseReady]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    await loadData();
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'medicines') return item.type === 'medicine';
    if (filter === 'sugar') return item.type === 'sugar';
    if (filter === 'bp') return item.type === 'bp';
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Clamp current page if totalPages shrinks due to filtering
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
        {/* Screen Header & Action Buttons */}
        <View className="pt-3 pb-2 flex-row justify-between items-start">
          <View className="gap-1 flex-1 pr-2">
            <Text className="text-[28px] font-bold text-charcoal dark:text-charcoal-dark">
              Intake & Health History
            </Text>
            <Text className="text-base font-semibold text-umber dark:text-umber-dark">
              Track past medicine doses, blood sugar, and blood pressure records.
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Export PDF Button */}
            <ScalePressable
              onPress={() => setIsExportModalOpen(true)}
              scaleTo={0.92}
              className="min-h-[44px] px-3 flex-row items-center gap-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
              accessibilityRole="button"
              accessibilityLabel="Export health records as PDF">
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

        {/* Historical Quick Entry Banner */}
        <View className="bg-card dark:bg-card-dark rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark p-3.5 my-2 flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
              Log Previous Readings
            </Text>
            <Text className="text-xs font-medium text-umber dark:text-umber-dark mt-0.5">
              Add past measurements from your paper log or records.
            </Text>
          </View>
          <View className="flex-row gap-2">
            <ScalePressable
              onPress={() => {
                setSelectedSugarLog(null);
                setIsAddSugarModalOpen(true);
              }}
              scaleTo={0.92}
              className="min-h-[42px] px-3.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark flex-row items-center gap-1.5 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Log past blood sugar reading">
              <Ionicons name="water-outline" size={16} color={colors.secondary} />
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">+ Sugar</Text>
            </ScalePressable>
            <ScalePressable
              onPress={() => {
                setSelectedBPLog(null);
                setIsAddBPModalOpen(true);
              }}
              scaleTo={0.92}
              className="min-h-[42px] px-3.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark flex-row items-center gap-1.5 active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Log past blood pressure reading">
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">+ BP</Text>
            </ScalePressable>
          </View>
        </View>

        {/* Filter Chips (Min 44px touch targets) */}
        <View className="flex-row flex-wrap gap-2 my-2">
          {[
            { key: 'all', label: 'All Records' },
            { key: 'medicines', label: 'Medicines' },
            { key: 'sugar', label: 'Blood Sugar' },
            { key: 'bp', label: 'Blood Pressure' },
          ].map((tab) => {
            const isSelected = filter === tab.key;
            return (
              <ScalePressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tab.label}`}
                accessibilityState={{ selected: isSelected }}
                scaleTo={0.92}
                onPress={() => {
                  setFilter(tab.key as FilterType);
                  setCurrentPage(1);
                }}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl border flex-row items-center justify-center ${
                  isSelected
                    ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                    : 'bg-card dark:bg-card-dark border-subtle-border dark:border-subtle-border-dark'
                }`}>
                <Text
                  className={`text-sm font-bold ${
                    isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                  }`}>
                  {tab.label}
                </Text>
              </ScalePressable>
            );
          })}
        </View>

        {/* Error message */}
        {error ? (
          <View className="p-3 my-2 bg-brick-tint dark:bg-brick-dark-tint border border-brick dark:border-brick-dark rounded-xl">
            <Text className="text-sm font-bold text-brick dark:text-brick-dark">{error}</Text>
          </View>
        ) : null}

        {/* Timeline Log List */}
        {loading ? (
          <HistorySkeleton />
        ) : (
          <>
            {filteredItems.length === 0 ? (
              <EmptyState
                iconName="history"
                title={
                  filter !== 'all'
                    ? `No ${
                        filter === 'medicines'
                          ? 'medicine'
                          : filter === 'bp'
                          ? 'blood pressure'
                          : 'blood sugar'
                      } records found`
                    : 'No routine history yet'
                }
                description={
                  filter !== 'all'
                    ? 'No records match this filter. Switch to all categories to view your full routine timeline.'
                    : 'When you take medicines, record blood pressure, or log blood sugar, your complete timeline will appear here.'
                }
                actionLabel={filter !== 'all' ? 'Show All History' : "Go to Today's Routine"}
                onAction={() => {
                  if (filter !== 'all') {
                    setFilter('all');
                  } else {
                    router.push('/');
                  }
                }}
              />
            ) : (
              <View className="gap-3">
                {paginatedItems.map((item) => {
                  let iconName: 'medkit-outline' | 'water-outline' | 'heart-outline' = 'medkit-outline';
                  let iconColor: string = colors.primary;
                  if (item.type === 'sugar') {
                    iconName = 'water-outline';
                    iconColor = colors.secondary;
                  } else if (item.type === 'bp') {
                    iconName = 'heart-outline';
                    iconColor = colors.primary;
                  }

                  const isEditable = item.type !== 'medicine';

                  return (
                    <ScalePressable
                      key={item.id}
                      disabled={!isEditable}
                      scaleTo={isEditable ? 0.98 : 1}
                      onPress={() => {
                        if (item.type === 'sugar' && item.rawSugarLog) {
                          setSelectedSugarLog(item.rawSugarLog);
                          setIsAddSugarModalOpen(true);
                        } else if (item.type === 'bp' && item.rawBPLog) {
                          setSelectedBPLog(item.rawBPLog);
                          setIsAddBPModalOpen(true);
                        }
                      }}
                      className={`bg-card dark:bg-card-dark border-[1.5px] border-subtle-border dark:border-subtle-border-dark rounded-2xl p-4 gap-2.5 ${
                        isEditable ? 'active:opacity-80' : ''
                      }`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1 pr-2">
                          <View className="w-10 h-10 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
                            <Ionicons name={iconName} size={18} color={iconColor} />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center gap-1.5">
                              <Text
                                numberOfLines={1}
                                className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                                {item.title}
                              </Text>
                              {isEditable ? (
                                <Ionicons name="pencil" size={13} color={colors.textMuted} />
                              ) : null}
                            </View>
                            <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
                              {item.subtitle}
                            </Text>
                          </View>
                        </View>

                        {item.status ? (
                          <StatusBadge status={item.status} />
                        ) : item.customBadge ? (
                          <View
                            className={`px-3 py-1.5 rounded-xl border ${item.customBadge.bg} ${item.customBadge.border}`}>
                            <Text className={`text-xs font-bold ${item.customBadge.text}`}>
                              {item.customBadge.label}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {item.notes ? (
                        <Text className="text-sm text-charcoal dark:text-charcoal-dark bg-surface dark:bg-surface-dark px-3 py-2 rounded-xl border border-subtle-border dark:border-subtle-border-dark">
                          Note: {item.notes}
                        </Text>
                      ) : null}
                    </ScalePressable>
                  );
                })}

                {/* Pagination Controls */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredItems.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Export Report Modal */}
      <ExportReportModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType={filter}
      />

      {/* Add / Edit Sugar Modal for Historical & Current Entry */}
      <AddEditSugarModal
        visible={isAddSugarModalOpen}
        initialLog={selectedSugarLog}
        onClose={() => {
          setIsAddSugarModalOpen(false);
          setSelectedSugarLog(null);
        }}
        onSuccess={loadData}
      />

      {/* Add / Edit BP Modal for Historical & Current Entry */}
      <AddEditBPModal
        visible={isAddBPModalOpen}
        initialLog={selectedBPLog}
        onClose={() => {
          setIsAddBPModalOpen(false);
          setSelectedBPLog(null);
        }}
        onSuccess={loadData}
      />
    </SafeAreaView>
  );
}
