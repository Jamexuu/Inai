import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { parse12HourParts } from '@/utils/date.utils';
import { PrimaryButton } from './primary-button';
import { useTheme } from '@/hooks/use-theme';

interface ScrollableTimePickerModalProps {
  visible: boolean;
  value: string;
  onConfirm: (time12Hour: string) => void;
  onClose: () => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1 to 12
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')); // 00 to 59
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

const ITEM_HEIGHT = 46;

export const ScrollableTimePickerModal: React.FC<ScrollableTimePickerModalProps> = ({
  visible,
  value,
  onConfirm,
  onClose,
}) => {
  const colors = useTheme();
  const [selectedHour, setSelectedHour] = useState<number>(8);
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Sync state whenever modal opens with current value
  useEffect(() => {
    if (visible) {
      const parts = parse12HourParts(value);
      setSelectedHour(parts.hour);
      setSelectedMinute(parts.minute.toString().padStart(2, '0'));
      setSelectedPeriod(parts.period);

      // Scroll columns to current positions after mount
      setTimeout(() => {
        const hourIndex = Math.max(0, parts.hour - 1);
        const minIndex = Math.max(0, parts.minute);
        hourScrollRef.current?.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
        minuteScrollRef.current?.scrollTo({ y: minIndex * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    const formatted = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    onConfirm(formatted);
    onClose();
  };

  const previewTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

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
          accessibilityLabel="Dismiss time picker"
        />

        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: colors.backgroundCard }}
          className="rounded-t-3xl border-t border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-5 pb-6 gap-4">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                Set Reminder Time
              </Text>
              <Text className="text-sm font-normal text-umber dark:text-umber-dark">
                Scroll or tap to choose the exact time.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-2 -mr-2 active:opacity-70"
              accessibilityLabel="Close time picker"
              accessibilityRole="button">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Time Preview Card */}
          <View className="flex-row items-center justify-center py-3 px-4 rounded-2xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark gap-2.5">
            <Ionicons name="time" size={22} color={colors.primary} />
            <Text className="text-2xl font-bold text-charcoal dark:text-charcoal-dark tracking-wide">
              {previewTime}
            </Text>
          </View>

          {/* Scrollable Pickers Container */}
          <View className="flex-row justify-between bg-canvas dark:bg-canvas-dark rounded-2xl border border-subtle-border dark:border-subtle-border-dark p-2 h-[220px]">
            {/* Hours Column (1-12) */}
            <View className="flex-1 items-center">
              <Text className="text-xs font-bold text-umber dark:text-umber-dark mb-1">Hour</Text>
              <ScrollView
                ref={hourScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                className="w-full">
                {HOURS.map((h) => {
                  const isSelected = selectedHour === h;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => setSelectedHour(h)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`rounded-xl items-center justify-center my-0.5 ${
                        isSelected
                          ? 'bg-sage dark:bg-sage-dark'
                          : 'active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-lg ${
                          isSelected
                            ? 'font-bold text-white'
                            : 'font-semibold text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {h}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Divider */}
            <View className="w-[1px] bg-subtle-border dark:bg-subtle-border-dark my-2 mx-1" />

            {/* Minutes Column (00-59) */}
            <View className="flex-1 items-center">
              <Text className="text-xs font-bold text-umber dark:text-umber-dark mb-1">Minute</Text>
              <ScrollView
                ref={minuteScrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                className="w-full">
                {MINUTES.map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setSelectedMinute(m)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`rounded-xl items-center justify-center my-0.5 ${
                        isSelected
                          ? 'bg-sage dark:bg-sage-dark'
                          : 'active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-lg ${
                          isSelected
                            ? 'font-bold text-white'
                            : 'font-semibold text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {m}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Divider */}
            <View className="w-[1px] bg-subtle-border dark:bg-subtle-border-dark my-2 mx-1" />

            {/* Period Column (AM / PM) */}
            <View className="w-20 items-center justify-center">
              <Text className="text-xs font-bold text-umber dark:text-umber-dark mb-3">AM / PM</Text>
              <View className="w-full gap-2">
                {PERIODS.map((p) => {
                  const isSelected = selectedPeriod === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setSelectedPeriod(p)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`rounded-xl items-center justify-center ${
                        isSelected
                          ? 'bg-sage dark:bg-sage-dark border border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark'
                      }`}>
                      <Text
                        className={`text-base ${
                          isSelected
                            ? 'font-bold text-white'
                            : 'font-semibold text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Action Button */}
          <PrimaryButton
            label="Confirm Time"
            variant="primary"
            onPress={handleConfirm}
            className="min-h-[52px]"
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
};
