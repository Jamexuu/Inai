import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { ScalePressable } from './scale-pressable';
import {
  formatDateToYMD,
  formatYMDToFullFriendly,
  getYesterdayYMD,
  getTwoDaysAgoYMD,
} from '@/utils/date.utils';
import { PrimaryButton } from './primary-button';

interface DatePickerModalProps {
  visible: boolean;
  value: string; // 'YYYY-MM-DD'
  onConfirm: (dateYMD: string) => void;
  onClose: () => void;
  maxDate?: string; // default today
  title?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  onConfirm,
  onClose,
  maxDate = formatDateToYMD(),
  title = 'Select Date',
}) => {
  const colors = useTheme();

  // Selected date YMD
  const [selectedYMD, setSelectedYMD] = useState<string>(value || formatDateToYMD());

  // Current view Year & Month
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth()); // 0 - 11

  useEffect(() => {
    if (visible) {
      const initial = value || formatDateToYMD();
      setSelectedYMD(initial);
      const parts = initial.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [visible, value]);

  // Quick shortcuts
  const todayYMD = formatDateToYMD();
  const yesterdayYMD = getYesterdayYMD();
  const twoDaysAgoYMD = getTwoDaysAgoYMD();

  const handleSelectQuick = (ymd: string) => {
    setSelectedYMD(ymd);
    const parts = ymd.split('-');
    if (parts.length === 3) {
      setViewYear(parseInt(parts[0], 10));
      setViewMonth(parseInt(parts[1], 10) - 1);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    // Prevent going past current month if maxDate is today
    if (maxDate && viewYear >= today.getFullYear() && viewMonth >= today.getMonth()) {
      return;
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun

  const daysGrid: Array<{ day: number | null; ymd: string | null; isFuture: boolean; isSelected: boolean; isToday: boolean }> = [];

  // Empty leading days
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysGrid.push({ day: null, ymd: null, isFuture: false, isSelected: false, isToday: false });
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const isFuture = maxDate ? ymd > maxDate : false;
    const isSelected = ymd === selectedYMD;
    const isToday = ymd === todayYMD;

    daysGrid.push({
      day: d,
      ymd,
      isFuture,
      isSelected,
      isToday,
    });
  }

  const isNextDisabled = Boolean(
    maxDate &&
      (viewYear > new Date().getFullYear() ||
        (viewYear === new Date().getFullYear() && viewMonth >= new Date().getMonth()))
  );

  const handleDayPress = (ymd: string | null, isFuture: boolean) => {
    if (!ymd || isFuture) return;
    setSelectedYMD(ymd);
  };

  const handleConfirm = () => {
    onConfirm(selectedYMD);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss date picker"
        />

        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: colors.backgroundCard }}
          className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark max-h-[92%]">
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="p-5 pb-6 gap-3.5"
            bounces={false}>
            {/* Header */}
            <View className="flex-row justify-between items-center">
              <View className="flex-1 pr-2">
                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  {title}
                </Text>
                <Text className="text-sm font-semibold text-umber dark:text-umber-dark mt-0.5">
                  {formatYMDToFullFriendly(selectedYMD)}
                </Text>
              </View>
              <ScalePressable
                onPress={onClose}
                scaleTo={0.9}
                className="min-w-[44px] min-h-[44px] items-center justify-center -mr-1.5 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Close date picker">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </ScalePressable>
            </View>

            {/* Quick Date Shortcut Chips */}
            <View className="flex-row flex-wrap gap-2 pt-1">
              {[
                { label: 'Today', ymd: todayYMD },
                { label: 'Yesterday', ymd: yesterdayYMD },
                { label: '2 Days Ago', ymd: twoDaysAgoYMD },
              ].map((chip) => {
                const isActive = selectedYMD === chip.ymd;
                return (
                  <ScalePressable
                    key={chip.label}
                    onPress={() => handleSelectQuick(chip.ymd)}
                    scaleTo={0.92}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border flex-row items-center justify-center active:opacity-80 ${
                      isActive
                        ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                        : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        isActive ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                      }`}>
                      {chip.label}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>

            {/* Month & Year Navigator */}
            <View className="flex-row items-center justify-between bg-surface dark:bg-surface-dark rounded-2xl p-2.5 border border-subtle-border dark:border-subtle-border-dark mt-1">
              <ScalePressable
                onPress={handlePrevMonth}
                scaleTo={0.9}
                className="min-w-[44px] min-h-[44px] items-center justify-center rounded-xl active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel="Previous month">
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </ScalePressable>

              <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>

              <ScalePressable
                onPress={handleNextMonth}
                disabled={isNextDisabled}
                scaleTo={0.9}
                className={`min-w-[44px] min-h-[44px] items-center justify-center rounded-xl ${
                  isNextDisabled ? 'opacity-30' : 'active:bg-card-selected'
                }`}
                accessibilityRole="button"
                accessibilityLabel="Next month">
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </ScalePressable>
            </View>

            {/* Days of Week Row */}
            <View className="flex-row justify-between px-1">
              {DAYS_OF_WEEK.map((dow, idx) => (
                <View key={dow} className="w-[13.5%] items-center justify-center">
                  <Text
                    className={`text-xs font-bold ${
                      idx === 0 || idx === 6
                        ? 'text-terracotta dark:text-terracotta-dark'
                        : 'text-umber dark:text-umber-dark'
                    }`}>
                    {dow}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="flex-row flex-wrap justify-between px-1">
              {daysGrid.map((item, index) => {
                if (!item.day) {
                  return <View key={`blank_${index}`} className="w-[13.5%] h-11" />;
                }

                let bgClass = 'bg-transparent';
                let borderClass = 'border-transparent';
                let textClass = 'text-charcoal dark:text-charcoal-dark font-medium';

                if (item.isSelected) {
                  bgClass = 'bg-sage dark:bg-sage-dark';
                  borderClass = 'border-sage dark:border-sage-dark';
                  textClass = 'text-white font-bold';
                } else if (item.isToday) {
                  borderClass = 'border-sage dark:border-sage-dark';
                  bgClass = 'bg-surface dark:bg-surface-dark';
                  textClass = 'text-sage dark:text-sage-dark font-bold';
                } else if (item.isFuture) {
                  textClass = 'text-muted-gray dark:text-muted-gray-dark opacity-35';
                }

                return (
                  <ScalePressable
                    key={item.ymd || index}
                    disabled={item.isFuture}
                    onPress={() => handleDayPress(item.ymd, item.isFuture)}
                    scaleTo={0.9}
                    className={`w-[13.5%] h-11 items-center justify-center rounded-full border mb-1 active:opacity-75 ${bgClass} ${borderClass}`}
                    accessibilityRole="button"
                    accessibilityLabel={item.ymd ? formatYMDToFullFriendly(item.ymd) : undefined}
                    accessibilityState={{ selected: item.isSelected, disabled: item.isFuture }}>
                    <Text className={`text-sm ${textClass}`}>{item.day}</Text>
                  </ScalePressable>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2.5 pt-2">
              <PrimaryButton
                label="Confirm Date"
                variant="primary"
                onPress={handleConfirm}
                className="flex-1 min-h-[48px]"
              />
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={onClose}
                className="flex-1 min-h-[48px]"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};
