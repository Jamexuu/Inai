import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
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
import { ScalePressable } from './scale-pressable';

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
  const { width: windowWidth } = useWindowDimensions();
  const isXs = windowWidth < 350;
  const isSm = windowWidth < 380;

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

        const condenseTime = todayLogs.length > 4 && isXs;
        return todayLogs.map((log) => {
          const d = new Date(log.loggedAt);
          const fullTime = formatTo12Hour(d);
          return {
            id: log.id,
            label: condenseTime ? fullTime.replace(/\s*[AP]M$/i, '') : fullTime,
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

        const condenseTime = todayLogs.length > 4 && isXs;
        return todayLogs.map((log) => {
          const d = new Date(log.loggedAt);
          const fullTime = formatTo12Hour(d);
          return {
            id: log.id,
            label: condenseTime ? fullTime.replace(/\s*[AP]M$/i, '') : fullTime,
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
  }, [timeframe, isSugar, sugarLogs, bpLogs, isXs]);

  // --------------------------------------------------------------------------
  // 3. Chart Scale and Target Line Setup
  // --------------------------------------------------------------------------
  const chartHeight = isXs ? 135 : 160;

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
    <View
      className={`rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark ${
        isXs ? 'p-3 gap-2.5 my-1.5' : 'p-4 gap-3.5 my-2'
      }`}>
      {/* Title & Legend */}
      <View className="flex-row items-center justify-between flex-wrap gap-2">
        <View className="flex-row items-center gap-2 flex-1 min-w-[130px]">
          <View className="w-8 h-8 rounded-lg bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center">
            <Ionicons
              name={isSugar ? 'water' : 'pulse'}
              size={18}
              color={isSugar ? colors.secondary : colors.primary}
            />
          </View>
          <Text
            numberOfLines={1}
            className={`${isXs ? 'text-sm' : 'text-base'} font-bold text-charcoal dark:text-charcoal-dark`}>
            {title || (isSugar ? 'Blood Sugar Trends' : 'Blood Pressure Trends')}
          </Text>
        </View>

        {/* Legend */}
        {isSugar ? (
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-sm bg-sage dark:bg-sage-dark" />
            <Text className="text-[11px] font-bold text-umber dark:text-umber-dark">
              {isXs ? 'Glucose' : 'Glucose (mg/dL)'}
            </Text>
          </View>
        ) : (
          <View className={`flex-row items-center ${isXs ? 'gap-2' : 'gap-3'}`}>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-sm bg-sage dark:bg-sage-dark" />
              <Text className="text-[11px] font-bold text-umber dark:text-umber-dark">
                {isXs ? 'Sys' : 'Systolic'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-sm bg-terracotta dark:bg-terracotta-dark" />
              <Text className="text-[11px] font-bold text-umber dark:text-umber-dark">
                {isXs ? 'Dia' : 'Diastolic'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* -------------------------------------------------------------------- */}
      {/* Average Calculation Cards (Weekly & Monthly)                         */}
      {/* -------------------------------------------------------------------- */}
      <View className="flex-row gap-2">
        {/* Weekly Average Card */}
        <View
          className={`flex-1 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark ${
            isXs ? 'p-2.5 gap-0.5' : 'p-3 gap-1'
          }`}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] sm:text-xs font-bold text-umber dark:text-umber-dark uppercase tracking-wider">
              This Week
            </Text>
            <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          </View>
          {isSugar ? (
            sugarWeeklyAvg && sugarWeeklyAvg.average !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text
                    className={`font-bold text-charcoal dark:text-charcoal-dark ${
                      isXs ? 'text-xl' : 'text-2xl'
                    }`}>
                    {sugarWeeklyAvg.average}
                  </Text>
                  <Text className="text-[10px] sm:text-xs font-bold text-umber dark:text-umber-dark">
                    mg/dL
                  </Text>
                </View>
                {(() => {
                  const cat = getSugarCategory(sugarWeeklyAvg.average, 'random');
                  const style = getSugarCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5 flex-wrap">
                      <View className={`px-1.5 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text
                          numberOfLines={1}
                          className={`font-bold ${style.textColor} ${isXs ? 'text-[9px]' : 'text-[10px]'}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`font-semibold text-muted-gray dark:text-muted-gray-dark ${
                          isXs ? 'text-[9px]' : 'text-[11px]'
                        }`}>
                        ({sugarWeeklyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-xs sm:text-sm font-semibold text-muted-gray dark:text-muted-gray-dark mt-2">
                No logs this week
              </Text>
            )
          ) : (
            bpWeeklyAvg && bpWeeklyAvg.avgSystolic !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text
                    numberOfLines={1}
                    className={`font-bold text-charcoal dark:text-charcoal-dark ${
                      isXs ? 'text-base' : isSm ? 'text-lg' : 'text-2xl'
                    }`}>
                    {bpWeeklyAvg.avgSystolic}/{bpWeeklyAvg.avgDiastolic}
                  </Text>
                  <Text className="text-[10px] sm:text-xs font-bold text-umber dark:text-umber-dark">
                    mmHg
                  </Text>
                </View>
                {(() => {
                  const cat = getBPCategory(bpWeeklyAvg.avgSystolic!, bpWeeklyAvg.avgDiastolic!);
                  const style = getBPCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5 flex-wrap">
                      <View className={`px-1.5 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text
                          numberOfLines={1}
                          className={`font-bold ${style.textColor} ${isXs ? 'text-[9px]' : 'text-[10px]'}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`font-semibold text-muted-gray dark:text-muted-gray-dark ${
                          isXs ? 'text-[9px]' : 'text-[11px]'
                        }`}>
                        ({bpWeeklyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-xs sm:text-sm font-semibold text-muted-gray dark:text-muted-gray-dark mt-2">
                No logs this week
              </Text>
            )
          )}
        </View>

        {/* Monthly Average Card */}
        <View
          className={`flex-1 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark ${
            isXs ? 'p-2.5 gap-0.5' : 'p-3 gap-1'
          }`}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] sm:text-xs font-bold text-umber dark:text-umber-dark uppercase tracking-wider">
              This Month
            </Text>
            <Ionicons name="stats-chart-outline" size={13} color={colors.textSecondary} />
          </View>
          {isSugar ? (
            sugarMonthlyAvg && sugarMonthlyAvg.average !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text
                    className={`font-bold text-charcoal dark:text-charcoal-dark ${
                      isXs ? 'text-xl' : 'text-2xl'
                    }`}>
                    {sugarMonthlyAvg.average}
                  </Text>
                  <Text className="text-[10px] sm:text-xs font-bold text-umber dark:text-umber-dark">
                    mg/dL
                  </Text>
                </View>
                {(() => {
                  const cat = getSugarCategory(sugarMonthlyAvg.average, 'random');
                  const style = getSugarCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5 flex-wrap">
                      <View className={`px-1.5 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text
                          numberOfLines={1}
                          className={`font-bold ${style.textColor} ${isXs ? 'text-[9px]' : 'text-[10px]'}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`font-semibold text-muted-gray dark:text-muted-gray-dark ${
                          isXs ? 'text-[9px]' : 'text-[11px]'
                        }`}>
                        ({sugarMonthlyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-xs sm:text-sm font-semibold text-muted-gray dark:text-muted-gray-dark mt-2">
                No logs this month
              </Text>
            )
          ) : (
            bpMonthlyAvg && bpMonthlyAvg.avgSystolic !== null ? (
              <>
                <View className="flex-row items-baseline gap-1 mt-0.5">
                  <Text
                    numberOfLines={1}
                    className={`font-bold text-charcoal dark:text-charcoal-dark ${
                      isXs ? 'text-base' : isSm ? 'text-lg' : 'text-2xl'
                    }`}>
                    {bpMonthlyAvg.avgSystolic}/{bpMonthlyAvg.avgDiastolic}
                  </Text>
                  <Text className="text-[10px] sm:text-xs font-bold text-umber dark:text-umber-dark">
                    mmHg
                  </Text>
                </View>
                {(() => {
                  const cat = getBPCategory(bpMonthlyAvg.avgSystolic!, bpMonthlyAvg.avgDiastolic!);
                  const style = getBPCategoryStyle(cat);
                  return (
                    <View className="flex-row items-center gap-1 mt-0.5 flex-wrap">
                      <View className={`px-1.5 py-0.5 rounded-md border ${style.badgeBg} ${style.badgeBorder}`}>
                        <Text
                          numberOfLines={1}
                          className={`font-bold ${style.textColor} ${isXs ? 'text-[9px]' : 'text-[10px]'}`}>
                          {style.label}
                        </Text>
                      </View>
                      <Text
                        numberOfLines={1}
                        className={`font-semibold text-muted-gray dark:text-muted-gray-dark ${
                          isXs ? 'text-[9px]' : 'text-[11px]'
                        }`}>
                        ({bpMonthlyAvg.count} logs)
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text className="text-xs sm:text-sm font-semibold text-muted-gray dark:text-muted-gray-dark mt-2">
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
          { key: 'today', label: 'Today', shortLabel: 'Today' },
          { key: 'week', label: 'This Week', shortLabel: 'Week' },
          { key: 'month', label: 'This Month', shortLabel: 'Month' },
          { key: 'year', label: 'This Year', shortLabel: 'Year' },
        ].map((tab) => {
          const isSelected = timeframe === tab.key;
          const displayLabel = isSm ? tab.shortLabel : tab.label;
          return (
            <ScalePressable
              key={tab.key}
              onPress={() => {
                setTimeframe(tab.key as TimeFrame);
                setSelectedPointIndex(null);
              }}
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel={`View ${tab.label} graph`}
              className={`flex-1 ${
                isXs ? 'min-h-[38px] py-1' : 'min-h-[44px]'
              } items-center justify-center rounded-lg transition-colors ${
                isSelected ? 'bg-sage dark:bg-sage-dark' : 'bg-transparent'
              }`}>
              <Text
                numberOfLines={1}
                className={`font-bold ${isXs ? 'text-[11px]' : 'text-xs'} ${
                  isSelected
                    ? isDark
                      ? 'text-[#101F18]'
                      : 'text-white'
                    : 'text-charcoal dark:text-charcoal-dark'
                }`}>
                {displayLabel}
              </Text>
            </ScalePressable>
          );
        })}
      </View>

      {/* -------------------------------------------------------------------- */}
      {/* Selected Data Point Detail Callout                                   */}
      {/* -------------------------------------------------------------------- */}
      {selectedPoint && selectedPoint.hasData ? (
        <View className="p-3 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark flex-row items-center justify-between flex-wrap gap-2">
          <View className="flex-1 min-w-[120px]">
            <Text className="text-xs font-bold text-umber dark:text-umber-dark">
              {selectedPoint.label} {selectedPoint.sublabel ? `· ${selectedPoint.sublabel}` : ''}
            </Text>
            {isSugar ? (
              <Text
                className={`${
                  isXs ? 'text-base' : 'text-lg'
                } font-bold text-charcoal dark:text-charcoal-dark`}>
                {selectedPoint.sugarLevel} mg/dL
              </Text>
            ) : (
              <Text
                className={`${
                  isXs ? 'text-base' : 'text-lg'
                } font-bold text-charcoal dark:text-charcoal-dark`}>
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
        <View className="h-40 items-center justify-center p-4 rounded-xl bg-surface dark:bg-surface-dark border border-dashed border-subtle-border dark:border-subtle-border-dark gap-2">
          <Ionicons name="analytics-outline" size={28} color={colors.textSecondary} />
          <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark text-center">
            {timeframe === 'today'
              ? 'No readings recorded today yet'
              : 'No records found for this period'}
          </Text>
          <Text className="text-xs font-medium text-umber dark:text-umber-dark text-center">
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
                borderBottomColor: isDark ? '#4A443C' : '#C5BFB7',
                borderStyle: 'dashed',
                zIndex: 1,
              }}>
              <Text
                className={`text-[9px] sm:text-[10px] font-semibold ${
                  isDark ? 'text-muted-gray-dark' : 'text-muted-gray'
                } -mt-4 pl-1`}>
                {isSugar ? 'Target: <140 mg/dL' : 'Target: 120/80 mmHg'}
              </Text>
            </View>

            {/* Baseline axis */}
            <View
              pointerEvents="none"
              className="absolute left-0 right-0 bottom-0 border-b border-subtle-border dark:border-subtle-border-dark z-0"
            />

            {/* Bars Row */}
            <View className="flex-row items-end justify-between h-full px-0.5 z-10">
              {dataPoints.map((point, index) => {
                const isSelected = selectedPointIndex === index;

                if (isSugar) {
                  const barH = point.hasData ? calculateBarHeight(point.sugarLevel) : 4;
                  const barW = Math.max(
                    isXs ? 8 : 10,
                    Math.min(isXs ? 20 : 28, Math.round((isXs ? 140 : 200) / dataPoints.length))
                  );
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
                          width: barW,
                        }}
                        className={`rounded-t-md transition-all ${
                          !point.hasData
                            ? isDark
                              ? 'bg-[#3A3530]'
                              : 'bg-[#DDD7CD]'
                            : isSelected
                            ? isDark
                              ? 'bg-[#FAF7F2]'
                              : 'bg-charcoal'
                            : point.isToday
                            ? isDark
                              ? 'bg-sage border-2 border-white/40'
                              : 'bg-sage border-2 border-charcoal/30'
                            : 'bg-sage'
                        }`}
                      />
                    </Pressable>
                  );
                } else {
                  // BP: Paired bars (Systolic & Diastolic)
                  const sysH = point.hasData ? calculateBarHeight(point.systolic) : 4;
                  const diaH = point.hasData ? calculateBarHeight(point.diastolic) : 4;
                  const barW = Math.max(
                    isXs ? 4 : 6,
                    Math.min(isXs ? 10 : 14, Math.round((isXs ? 80 : 120) / dataPoints.length))
                  );
                  const pairGap = isXs || dataPoints.length > 7 ? 2 : 4;

                  return (
                    <Pressable
                      key={point.id}
                      onPress={() => setSelectedPointIndex(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`${point.label}: ${point.systolic ?? '-'}/${point.diastolic ?? '-'} mmHg`}
                      className="flex-1 items-center justify-end h-full min-h-[44px]">
                      <View className="flex-row items-end" style={{ gap: pairGap }}>
                        {/* Systolic Bar */}
                        <View
                          style={{ height: sysH, width: barW }}
                          className={`rounded-t-sm ${
                            !point.hasData
                              ? isDark
                                ? 'bg-[#3A3530]'
                                : 'bg-[#DDD7CD]'
                              : isSelected
                              ? isDark
                                ? 'bg-[#FAF7F2]'
                                : 'bg-charcoal'
                              : 'bg-sage'
                          }`}
                        />
                        {/* Diastolic Bar */}
                        <View
                          style={{ height: diaH, width: barW }}
                          className={`rounded-t-sm ${
                            !point.hasData
                              ? isDark
                                ? 'bg-[#3A3530]'
                                : 'bg-[#DDD7CD]'
                              : isSelected
                              ? isDark
                                ? 'bg-[#DDD7CD]'
                                : 'bg-charcoal/70'
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
          <View className="flex-row justify-between pt-2 px-0.5">
            {dataPoints.map((point, index) => {
              const isSelected = selectedPointIndex === index;
              const displayLabel =
                timeframe === 'year' && isXs ? point.label.substring(0, 1) : point.label;
              return (
                <Pressable
                  key={`label_${point.id}`}
                  onPress={() => setSelectedPointIndex(index)}
                  className="flex-1 items-center">
                  <Text
                    numberOfLines={1}
                    className={`${
                      isXs || dataPoints.length > 7 ? 'text-[9px]' : 'text-[11px]'
                    } ${
                      isSelected
                        ? 'font-bold text-charcoal dark:text-charcoal-dark'
                        : point.isToday
                        ? 'font-bold text-sage dark:text-sage-dark underline'
                        : 'font-semibold text-umber dark:text-umber-dark'
                    }`}>
                    {displayLabel}
                  </Text>
                  {point.sublabel && timeframe !== 'year' ? (
                    <Text
                      numberOfLines={1}
                      className={`${
                        isXs ? 'text-[8px]' : 'text-[9px]'
                      } font-medium text-muted-gray dark:text-muted-gray-dark`}>
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
