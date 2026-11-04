import React from 'react';
import { View, Text } from 'react-native';
import { ScalePressable } from './scale-pressable';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import {
  getWeekDates,
  formatDateToYMD,
  formatWeekRangeDisplay,
  getPreviousWeekDate,
  getNextWeekDate,
} from '@/utils/date.utils';
import { DayDoseCount } from '@/repositories/medicine-log.repository';

interface WeekDaySelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  dayStatuses?: Record<string, DayDoseCount>;
  className?: string;
}

export const WeekDaySelector: React.FC<WeekDaySelectorProps> = ({
  selectedDate,
  onSelectDate,
  dayStatuses = {},
  className = '',
}) => {
  const colors = useTheme();
  const weekDays = getWeekDates(selectedDate);
  const selectedYMD = formatDateToYMD(selectedDate);
  const todayYMD = formatDateToYMD(new Date());
  const isSelectedToday = selectedYMD === todayYMD;

  const handlePrevWeek = () => {
    onSelectDate(getPreviousWeekDate(selectedDate));
  };

  const handleNextWeek = () => {
    onSelectDate(getNextWeekDate(selectedDate));
  };

  const handleResetToday = () => {
    onSelectDate(new Date());
  };

  const weekRangeText = formatWeekRangeDisplay(selectedDate);

  return (
    <View
      className={`rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-3.5 my-2 gap-3 ${className}`}>
      {/* Header Row: Navigation & Week Range */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 flex-1 pr-2">
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
            {weekRangeText}
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          {!isSelectedToday ? (
            <ScalePressable
              onPress={handleResetToday}
              scaleTo={0.92}
              className="min-h-[38px] px-2.5 rounded-lg bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center active:opacity-80"
              accessibilityRole="button"
              accessibilityLabel="Return to today's date">
              <Text className="text-xs font-bold text-sage dark:text-sage-dark">
                Today
              </Text>
            </ScalePressable>
          ) : null}

          {/* Previous Week */}
          <ScalePressable
            onPress={handlePrevWeek}
            hitSlop={6}
            scaleTo={0.9}
            className="w-9 h-9 rounded-lg bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel="Previous week">
            <Ionicons name="chevron-back" size={18} color={colors.primary} />
          </ScalePressable>

          {/* Next Week */}
          <ScalePressable
            onPress={handleNextWeek}
            hitSlop={6}
            scaleTo={0.9}
            className="w-9 h-9 rounded-lg bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark items-center justify-center active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel="Next week">
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </ScalePressable>
        </View>
      </View>

      {/* 7-Day Strip */}
      <View className="flex-row items-center justify-between gap-1.5">
        {weekDays.map((item) => {
          const isSelected = item.ymd === selectedYMD;
          const status = dayStatuses[item.ymd];
          const isAllTaken = status?.isAllTaken;
          const hasPartial = status && status.takenCount > 0 && !status.isAllTaken;
          const isPastPending = status && !item.isFuture && !item.isToday && status.takenCount === 0 && status.totalScheduled > 0;

          let accessibilityDesc = `${item.dayName}, day ${item.dayNumber}`;
          if (item.isToday) accessibilityDesc += ', Today';
          if (isAllTaken) accessibilityDesc += ', All medicines taken';
          if (isSelected) accessibilityDesc += ', Selected';

          return (
            <ScalePressable
              key={item.ymd}
              onPress={() => onSelectDate(item.date)}
              scaleTo={0.92}
              accessibilityRole="button"
              accessibilityLabel={accessibilityDesc}
              accessibilityState={{ selected: isSelected }}
              className={`flex-1 min-h-[58px] py-2 rounded-xl border items-center justify-between active:opacity-80 ${
                isSelected
                  ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark shadow-sm'
                  : item.isToday
                  ? 'bg-surface dark:bg-surface-dark border-sage/40 dark:border-sage-dark/40'
                  : 'bg-surface dark:bg-surface-dark border-transparent'
              }`}>
              {/* Day Abbreviation */}
              <Text
                className={`text-[12px] font-bold ${
                  isSelected
                    ? 'text-white'
                    : item.isToday
                    ? 'text-sage dark:text-sage-dark'
                    : 'text-umber dark:text-umber-dark'
                }`}>
                {item.dayName}
              </Text>

              {/* Day Number */}
              <Text
                className={`text-base font-bold ${
                  isSelected
                    ? 'text-white'
                    : 'text-charcoal dark:text-charcoal-dark'
                }`}>
                {item.dayNumber}
              </Text>

              {/* Status Dot */}
              <View className="h-2 items-center justify-center">
                {isAllTaken ? (
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-herbal dark:bg-herbal-dark'
                    }`}
                  />
                ) : hasPartial ? (
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-terracotta dark:bg-terracotta-dark'
                    }`}
                  />
                ) : isPastPending ? (
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white/70' : 'bg-brick/70 dark:bg-brick-dark/70'
                    }`}
                  />
                ) : item.isToday ? (
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-sage dark:bg-sage-dark'
                    }`}
                  />
                ) : null}
              </View>
            </ScalePressable>
          );
        })}
      </View>
    </View>
  );
};
