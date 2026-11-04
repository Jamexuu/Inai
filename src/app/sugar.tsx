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
import { bloodSugarService } from '@/services/blood-sugar.service';
import { BloodSugarLog } from '@/types';
import {
  SectionHeader,
  EmptyState,
  PrimaryButton,
  SugarSkeleton,
  HealthBarGraph,
  PaginationControls,
  ScalePressable,
} from '@/components/ui';
import { AddEditSugarModal } from '@/components/add-edit-sugar-modal';
import { ExportReportModal } from '@/components/export-report-modal';
import { formatTo12Hour } from '@/utils/date.utils';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BloodSugarLog | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!isDatabaseReady) return;
    setError(null);
    try {
      const data = await bloodSugarService.getAllLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error loading blood sugar logs:', err);
      setError("We couldn't load blood sugar records. Please try again.");
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
            {/* Quick Overview Hero Card */}
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

      {/* Export Report Modal */}
      <ExportReportModal
        visible={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType="sugar"
      />
    </SafeAreaView>
  );
}
