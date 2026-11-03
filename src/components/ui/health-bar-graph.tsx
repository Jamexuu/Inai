import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BloodSugarLog, BloodPressureLog } from '@/types';
import { getSugarCategory, getSugarCategoryStyle } from '@/utils/sugar.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';
import { formatTo12Hour } from '@/utils/date.utils';
import { bloodSugarService, SugarAverageResult } from '@/services/blood-sugar.service';
import { bloodPressureService, BPAverageResult } from '@/services/blood-pressure.service';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type TimeFrame = 'today' | 'week' | 'month' | 'year';

interface BarDataPoint {
  id: string;
  label: string; // X-axis label (e.g. "Mon", "W1", "Jan", "8 AM")
  sublabel?: string; // e.g. "Oct 7"
  isToday?: boolean;
  hasData: boolean;
  // Sugar
  sugarLevel?: number;
  // BP
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  count: number;
}

export interface HealthBarGraphProps {
  type: 'sugar' | 'bp';
  sugarLogs?: BloodSugarLog[];
  bpLogs?: BloodPressureLog[];
  title?: string;
}

export const HealthBarGraph: React.FC<HealthBarGraphProps> = ({
  type,
  sugarLogs = [],
  bpLogs = [],
  title,
}) => {
  const colors = useTheme();
  const isDark = useColorScheme() === 'dark';
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const isSugar = type === 'sugar';

  // --------------------------------------------------------------------------
  // 1. Calculate Weekly and Monthly Averages (Prominent requirement)
  // --------------------------------------------------------------------------
  const sugarWeeklyAvg: SugarAverageResult | null = useMemo(() => {
    return isSugar ? bloodSugarService.calculateWeeklyAverage(sugarLogs) : null;
  }, [isSugar, sugarLogs]);

  const bpWeeklyAvg: BPAverageResult | null = useMemo(() => {
    return !isSugar ? bloodPressureService.calculateWeeklyAverage(bpLogs) : null;
  }, [isSugar, bpLogs]);

  const sugarMonthlyAvg: SugarAverageResult | null = useMemo(() => {
    return isSugar ? bloodSugarService.calculateMonthlyAverage(sugarLogs) : null;
  }, [isSugar, sugarLogs]);

  const bpMonthlyAvg: BPAverageResult | null = useMemo(() => {
    return !isSugar ? bloodPressureService.calculateMonthlyAverage(bpLogs) : null;
  }, [isSugar, bpLogs]);

  // --------------------------------------------------------------------------
  // 2. Aggregate Data Points for Selected Timeframe
  // --------------------------------------------------------------------------
  const dataPoints: BarDataPoint[] = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);

    // --- TODAY ---
    if (timeframe === 'today') {
      if (isSugar) {
        const todayLogs = sugarLogs
          .filter((l) => l.loggedAt.substring(0, 10) === todayStr)
          .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());

        if (todayLogs.length === 0) return [];

        return todayLogs.map((log) => {
          const d = new Date(log.loggedAt);
          return {
            id: log.id,
            label: formatTo12Hour(d),
            sublabel: log.context.replace('_', ' '),
            hasData: true,
            sugarLevel: log.level,
            count: 1,
            isToday: true,
          };
        });
      } else {
        const todayLogs = bpLogs
          .filter((l) => l.loggedAt.substring(0, 10) === todayStr)
          .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime());

        if (todayLogs.length === 0) return [];

        return todayLogs.map((log) => {
          const d = new Date(log.loggedAt);
          return {
            id: log.id,
            label: formatTo12Hour(d),
            sublabel: `${log.pulse ? log.pulse + ' bpm' : ''}`,
            hasData: true,
            systolic: log.systolic,
            diastolic: log.diastolic,
            pulse: log.pulse,
            count: 1,
            isToday: true,
          };
        });
      }
    }

    // --- THIS WEEK (Mon - Sun) ---
    if (timeframe === 'week') {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const points: BarDataPoint[] = [];

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(monday);
        currentDay.setDate(monday.getDate() + i);
        const dateStr = currentDay.toISOString().substring(0, 10);
        const isCurrentDay = dateStr === todayStr;

        if (isSugar) {
          const matching = sugarLogs.filter((l) => l.loggedAt.substring(0, 10) === dateStr);
          if (matching.length > 0) {
            const sum = matching.reduce((acc, curr) => acc + curr.level, 0);
            points.push({
              id: `week_${i}`,
              label: daysOfWeek[i],
              sublabel: `${currentDay.getDate()}`,
              hasData: true,
              sugarLevel: Math.round(sum / matching.length),
              count: matching.length,
              isToday: isCurrentDay,
            });
          } else {
            points.push({
              id: `week_${i}`,
              label: daysOfWeek[i],
              sublabel: `${currentDay.getDate()}`,
              hasData: false,
              count: 0,
              isToday: isCurrentDay,
            });
          }
        } else {
          const matching = bpLogs.filter((l) => l.loggedAt.substring(0, 10) === dateStr);
          if (matching.length > 0) {
            const sumSys = matching.reduce((acc, curr) => acc + curr.systolic, 0);
            const sumDia = matching.reduce((acc, curr) => acc + curr.diastolic, 0);
            const pulseLogs = matching.filter((l) => l.pulse && l.pulse > 0);
            const sumPulse = pulseLogs.reduce((acc, curr) => acc + (curr.pulse || 0), 0);

            points.push({
              id: `week_${i}`,
              label: daysOfWeek[i],
              sublabel: `${currentDay.getDate()}`,
              hasData: true,
              systolic: Math.round(sumSys / matching.length),
              diastolic: Math.round(sumDia / matching.length),
              pulse: pulseLogs.length > 0 ? Math.round(sumPulse / pulseLogs.length) : undefined,
              count: matching.length,
              isToday: isCurrentDay,
            });
          } else {
            points.push({
              id: `week_${i}`,
              label: daysOfWeek[i],
              sublabel: `${currentDay.getDate()}`,
              hasData: false,
              count: 0,
              isToday: isCurrentDay,
            });
          }
        }
      }
      return points;
    }

    // --- THIS MONTH (5 calendar segments / weeks) ---
    if (timeframe === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const segments = [
        { label: 'W1', start: 1, end: 7 },
        { label: 'W2', start: 8, end: 14 },
        { label: 'W3', start: 15, end: 21 },
        { label: 'W4', start: 22, end: 28 },
        { label: 'W5', start: 29, end: daysInMonth },
      ];

      return segments.map((seg, idx) => {
        const isCurrentSegment = now.getDate() >= seg.start && now.getDate() <= seg.end;

        if (isSugar) {
          const matching = sugarLogs.filter((l) => {
            const ld = new Date(l.loggedAt);
            return (
              ld.getFullYear() === year &&
              ld.getMonth() === month &&
              ld.getDate() >= seg.start &&
              ld.getDate() <= seg.end
            );
          });

          if (matching.length > 0) {
            const sum = matching.reduce((acc, curr) => acc + curr.level, 0);
            return {
              id: `month_seg_${idx}`,
              label: seg.label,
              sublabel: `${seg.start}-${seg.end}`,
              hasData: true,
              sugarLevel: Math.round(sum / matching.length),
              count: matching.length,
              isToday: isCurrentSegment,
            };
          } else {
            return {
              id: `month_seg_${idx}`,
              label: seg.label,
              sublabel: `${seg.start}-${seg.end}`,
              hasData: false,
              count: 0,
              isToday: isCurrentSegment,
            };
          }
        } else {
          const matching = bpLogs.filter((l) => {
            const ld = new Date(l.loggedAt);
            return (
              ld.getFullYear() === year &&
              ld.getMonth() === month &&
              ld.getDate() >= seg.start &&
              ld.getDate() <= seg.end
            );
          });

          if (matching.length > 0) {
            const sumSys = matching.reduce((acc, curr) => acc + curr.systolic, 0);
            const sumDia = matching.reduce((acc, curr) => acc + curr.diastolic, 0);
            return {
              id: `month_seg_${idx}`,
              label: seg.label,
              sublabel: `${seg.start}-${seg.end}`,
              hasData: true,
              systolic: Math.round(sumSys / matching.length),
              diastolic: Math.round(sumDia / matching.length),
              count: matching.length,
              isToday: isCurrentSegment,
            };
          } else {
            return {
              id: `month_seg_${idx}`,
              label: seg.label,
              sublabel: `${seg.start}-${seg.end}`,
              hasData: false,
              count: 0,
              isToday: isCurrentSegment,
            };
          }
        }
      });
    }

    // --- THIS YEAR (12 Months) ---
    if (timeframe === 'year') {
      const year = now.getFullYear();
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];

      return monthNames.map((mName, mIdx) => {
        const isCurrentMonth = now.getMonth() === mIdx;

        if (isSugar) {
          const matching = sugarLogs.filter((l) => {
            const ld = new Date(l.loggedAt);
            return ld.getFullYear() === year && ld.getMonth() === mIdx;
          });

          if (matching.length > 0) {
            const sum = matching.reduce((acc, curr) => acc + curr.level, 0);
            return {
              id: `year_${mIdx}`,
              label: mName,
              hasData: true,
              sugarLevel: Math.round(sum / matching.length),
              count: matching.length,
              isToday: isCurrentMonth,
            };
          } else {
            return {
              id: `year_${mIdx}`,
              label: mName,
              hasData: false,
              count: 0,
              isToday: isCurrentMonth,
            };
          }
        } else {
          const matching = bpLogs.filter((l) => {
            const ld = new Date(l.loggedAt);
            return ld.getFullYear() === year && ld.getMonth() === mIdx;
          });

          if (matching.length > 0) {
            const sumSys = matching.reduce((acc, curr) => acc + curr.systolic, 0);
            const sumDia = matching.reduce((acc, curr) => acc + curr.diastolic, 0);
            return {
              id: `year_${mIdx}`,
              label: mName,
              hasData: true,
              systolic: Math.round(sumSys / matching.length),
              diastolic: Math.round(sumDia / matching.length),
              count: matching.length,
              isToday: isCurrentMonth,
            };
          } else {
            return {
              id: `year_${mIdx}`,
              label: mName,
              hasData: false,
              count: 0,
              isToday: isCurrentMonth,
            };
          }
        }
      });
    }

    return [];
  }, [timeframe, isSugar, sugarLogs, bpLogs]);

  // --------------------------------------------------------------------------
  // 3. Chart Scale and Target Line Setup
  // --------------------------------------------------------------------------
  const chartHeight = 160;

  // For Sugar: scale 50 to 220
  // For BP: scale 40 to 190
  const minVal = isSugar ? 50 : 40;
  const maxVal = isSugar ? 220 : 190;

  const targetLineVal = isSugar ? 140 : 120; // 140 mg/dL target / 120 mmHg systolic target
  const targetLineBottom = Math.max(
    0,
    Math.min(chartHeight, ((targetLineVal - minVal) / (maxVal - minVal)) * chartHeight)
  );

  const calculateBarHeight = (val?: number) => {
    if (!val || val <= minVal) return 6;
    const clamped = Math.min(val, maxVal);
    return Math.max(6, ((clamped - minVal) / (maxVal - minVal)) * chartHeight);
  };

  const selectedPoint =
    selectedPointIndex !== null && dataPoints[selectedPointIndex]
      ? dataPoints[selectedPointIndex]
      : null;

  return (
    <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 my-2 gap-3.5">
      {/* Title & Legend */}
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-lg bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
            <Ionicons
              name={isSugar ? 'water' : 'pulse'}
              size={18}
              color={isSugar ? colors.secondary : colors.primary}
            />
          </View>
          <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
            {title || (isSugar ? 'Blood Sugar Trends' : 'Blood Pressure Trends')}
          </Text>
        </View>

        {/* Legend */}
        {isSugar ? (
          <View className="flex-row items-center gap-1.5">
            <View className="w-3 h-3 rounded-sm bg-sage dark:bg-sage-dark" />
            <Text className="text-xs font-bold text-umber dark:text-umber-dark">Glucose (mg/dL)</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-sm bg-sage dark:bg-sage-dark" />
              <Text className="text-xs font-bold text-umber dark:text-umber-dark">Systolic</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-sm bg-terracotta dark:bg-terracotta-dark" />
              <Text className="text-xs font-bold text-umber dark:text-umber-dark">Diastolic</Text>
            </View>
          </View>
        )}
      </View>

      {/* -------------------------------------------------------------------- */}
      {/* Average Calculation Cards (Weekly & Monthly)                         */}
      {/* -------------------------------------------------------------------- */}
      <View className="flex-row gap-2.5">
        {/* Weekly Average Card */}
        <View className="flex-1 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark p-3 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-umber dark:text-umber-dark uppercase tracking-wider">
              This Week
            </Text>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          </View>
          {isSugar ? (
            sugarWeeklyAvg && sugarWeeklyAvg.average !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text className="text-2xl font-bold text-charcoal">
                    {sugarWeeklyAvg.average}
                  </Text>
                  <Text className="text-xs font-bold text-umber">mg/dL</Text>
                </View>
                {(() => {
                  const cat = getSugarCategory(sugarWeeklyAvg.average, 'random');
                  const style = getSugarCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <View className={`px-2 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text className={`text-[10px] font-bold ${style.textColor}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold text-muted-gray">
                        ({sugarWeeklyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-sm font-semibold text-muted-gray mt-2">
                No logs this week
              </Text>
            )
          ) : (
            bpWeeklyAvg && bpWeeklyAvg.avgSystolic !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text className="text-2xl font-bold text-charcoal">
                    {bpWeeklyAvg.avgSystolic}/{bpWeeklyAvg.avgDiastolic}
                  </Text>
                  <Text className="text-xs font-bold text-umber">mmHg</Text>
                </View>
                {(() => {
                  const cat = getBPCategory(bpWeeklyAvg.avgSystolic!, bpWeeklyAvg.avgDiastolic!);
                  const style = getBPCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <View className={`px-2 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text className={`text-[10px] font-bold ${style.textColor}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold text-muted-gray">
                        ({bpWeeklyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-sm font-semibold text-muted-gray mt-2">
                No logs this week
              </Text>
            )
          )}
        </View>

        {/* Monthly Average Card */}
        <View className="flex-1 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark p-3 gap-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-umber dark:text-umber-dark uppercase tracking-wider">
              This Month
            </Text>
            <Ionicons name="stats-chart-outline" size={14} color={colors.textSecondary} />
          </View>
          {isSugar ? (
            sugarMonthlyAvg && sugarMonthlyAvg.average !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark">
                    {sugarMonthlyAvg.average}
                  </Text>
                  <Text className="text-xs font-bold text-umber dark:text-umber-dark">mg/dL</Text>
                </View>
                {(() => {
                  const cat = getSugarCategory(sugarMonthlyAvg.average, 'random');
                  const style = getSugarCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <View className={`px-2 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text className={`text-[10px] font-bold ${style.textColor}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold text-muted-gray dark:text-muted-gray-dark">
                        ({sugarMonthlyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-sm font-semibold text-muted-gray dark:text-muted-gray-dark mt-2">
                No logs this month
              </Text>
            )
          ) : (
            bpMonthlyAvg && bpMonthlyAvg.avgSystolic !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark">
                    {bpMonthlyAvg.avgSystolic}/{bpMonthlyAvg.avgDiastolic}
                  </Text>
                  <Text className="text-xs font-bold text-umber dark:text-umber-dark">mmHg</Text>
                </View>
                {(() => {
                  const cat = getBPCategory(bpMonthlyAvg.avgSystolic!, bpMonthlyAvg.avgDiastolic!);
                  const style = getBPCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <View className={`px-2 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text className={`text-[10px] font-bold ${style.textColor}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-semibold text-muted-gray dark:text-muted-gray-dark">
                        ({bpMonthlyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-sm font-semibold text-muted-gray dark:text-muted-gray-dark mt-2">
                No logs this month
              </Text>
            )
          )}
        </View>
      </View>

      {/* -------------------------------------------------------------------- */}
      {/* Timeframe Selector Chips                                             */}
      {/* -------------------------------------------------------------------- */}
      <View className="flex-row rounded-xl bg-surface dark:bg-surface-dark p-1 border border-subtle-border dark:border-subtle-border-dark">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'year', label: 'This Year' },
        ].map((tab) => {
          const isSelected = timeframe === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                setTimeframe(tab.key as TimeFrame);
                setSelectedPointIndex(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={`View ${tab.label} graph`}
              className={`flex-1 min-h-[44px] items-center justify-center rounded-lg transition-colors ${
                isSelected ? 'bg-sage dark:bg-sage-dark' : 'bg-transparent'
              }`}>
              <Text
                className={`text-xs font-bold ${
                  isSelected ? (isDark ? 'text-[#101F18]' : 'text-white') : 'text-charcoal dark:text-charcoal-dark'
                }`}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* -------------------------------------------------------------------- */}
      {/* Selected Data Point Detail Callout                                   */}
      {/* -------------------------------------------------------------------- */}
      {selectedPoint && selectedPoint.hasData ? (
        <View className="p-3 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold text-umber dark:text-umber-dark">
              {selectedPoint.label} {selectedPoint.sublabel ? `· ${selectedPoint.sublabel}` : ''}
            </Text>
            {isSugar ? (
              <Text className="text-lg font-bold text-charcoal dark:text-charcoal-dark">
                {selectedPoint.sugarLevel} mg/dL
              </Text>
            ) : (
              <Text className="text-lg font-bold text-charcoal dark:text-charcoal-dark">
                {selectedPoint.systolic}/{selectedPoint.diastolic} mmHg
                {selectedPoint.pulse ? ` · ${selectedPoint.pulse} bpm` : ''}
              </Text>
            )}
          </View>

          {isSugar ? (
            (() => {
              const cat = getSugarCategory(selectedPoint.sugarLevel || 100, 'random');
              const style = getSugarCategoryStyle(cat);
              return (
                <View className={`px-2.5 py-1 rounded-lg border ${style.badgeBg} ${style.badgeBorder}`}>
                  <Text className={`text-xs font-bold ${style.textColor}`}>
                    {style.label}
                  </Text>
                </View>
              );
            })()
          ) : (
            (() => {
              const cat = getBPCategory(selectedPoint.systolic || 120, selectedPoint.diastolic || 80);
              const style = getBPCategoryStyle(cat);
              return (
                <View className={`px-2.5 py-1 rounded-lg border ${style.badgeBg} ${style.badgeBorder}`}>
                  <Text className={`text-xs font-bold ${style.textColor}`}>
                    {style.label}
                  </Text>
                </View>
              );
            })()
          )}
        </View>
      ) : null}

      {/* -------------------------------------------------------------------- */}
      {/* Bar Chart Canvas Area                                                */}
      {/* -------------------------------------------------------------------- */}
      {dataPoints.length === 0 ? (
        <View className="h-40 items-center justify-center p-4 rounded-xl bg-surface border border-dashed border-subtle-border gap-2">
          <Ionicons name="analytics-outline" size={28} color="#8E867E" />
          <Text className="text-sm font-bold text-charcoal text-center">
            {timeframe === 'today'
              ? 'No readings recorded today yet'
              : 'No records found for this period'}
          </Text>
          <Text className="text-xs font-medium text-umber text-center">
            Log a reading above to see the bar chart update.
          </Text>
        </View>
      ) : (
        <View className="pt-2 pb-1">
          {/* Chart Viewport */}
          <View style={{ height: chartHeight }} className="relative justify-end">
            {/* Horizontal Target Reference Line */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: targetLineBottom,
                borderBottomWidth: 1,
                borderBottomColor: '#C5BFB7',
                borderStyle: 'dashed',
                zIndex: 1,
              }}>
              <Text className="text-[10px] font-semibold text-muted-gray -mt-4 pl-1">
                {isSugar ? 'Target: <140 mg/dL' : 'Target: 120/80 mmHg'}
              </Text>
            </View>

            {/* Baseline axis */}
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 bottom-0 border-b border-subtle-border z-0"
            />

            {/* Bars Row */}
            <View className="flex-row items-end justify-between h-full px-1 z-10">
              {dataPoints.map((point, index) => {
                const isSelected = selectedPointIndex === index;

                if (isSugar) {
                  const barH = point.hasData ? calculateBarHeight(point.sugarLevel) : 4;
                  return (
                    <Pressable
                      key={point.id}
                      onPress={() => setSelectedPointIndex(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`${point.label}: ${point.sugarLevel ?? 'No data'} mg/dL`}
                      className="flex-1 items-center justify-end h-full min-h-[44px]">
                      <View
                        style={{
                          height: barH,
                          width: Math.max(12, Math.min(28, 200 / dataPoints.length)),
                        }}
                        className={`rounded-t-md transition-all ${
                          !point.hasData
                            ? 'bg-[#DDD7CD]'
                            : isSelected
                            ? 'bg-charcoal'
                            : point.isToday
                            ? 'bg-sage border-2 border-charcoal/30'
                            : 'bg-sage'
                        }`}
                      />
                    </Pressable>
                  );
                } else {
                  // BP: Paired bars (Systolic & Diastolic)
                  const sysH = point.hasData ? calculateBarHeight(point.systolic) : 4;
                  const diaH = point.hasData ? calculateBarHeight(point.diastolic) : 4;
                  const barW = Math.max(7, Math.min(14, 120 / dataPoints.length));

                  return (
                    <Pressable
                      key={point.id}
                      onPress={() => setSelectedPointIndex(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`${point.label}: ${point.systolic ?? '-'}/${point.diastolic ?? '-'} mmHg`}
                      className="flex-1 items-center justify-end h-full min-h-[44px]">
                      <View className="flex-row items-end gap-1">
                        {/* Systolic Bar */}
                        <View
                          style={{ height: sysH, width: barW }}
                          className={`rounded-t-sm ${
                            !point.hasData
                              ? 'bg-[#DDD7CD]'
                              : isSelected
                              ? 'bg-charcoal'
                              : 'bg-sage'
                          }`}
                        />
                        {/* Diastolic Bar */}
                        <View
                          style={{ height: diaH, width: barW }}
                          className={`rounded-t-sm ${
                            !point.hasData
                              ? 'bg-[#DDD7CD]'
                              : isSelected
                              ? 'bg-charcoal/70'
                              : 'bg-terracotta'
                          }`}
                        />
                      </View>
                    </Pressable>
                  );
                }
              })}
            </View>
          </View>

          {/* X-Axis Labels Row */}
          <View className="flex-row justify-between pt-2 px-1">
            {dataPoints.map((point, index) => {
              const isSelected = selectedPointIndex === index;
              return (
                <Pressable
                  key={`label_${point.id}`}
                  onPress={() => setSelectedPointIndex(index)}
                  className="flex-1 items-center">
                  <Text
                    numberOfLines={1}
                    className={`text-[11px] ${
                      isSelected
                        ? 'font-bold text-charcoal'
                        : point.isToday
                        ? 'font-bold text-sage underline'
                        : 'font-semibold text-umber'
                    }`}>
                    {point.label}
                  </Text>
                  {point.sublabel && timeframe !== 'year' ? (
                    <Text
                      numberOfLines={1}
                      className="text-[9px] font-medium text-muted-gray">
                      {point.sublabel}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};
