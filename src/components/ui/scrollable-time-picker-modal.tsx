import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parse12HourParts } from '@/utils/date.utils';
import { PrimaryButton } from './primary-button';

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
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="rounded-t-3xl border-t border-subtle-border bg-card p-5 pb-9 gap-4">
          {/* Header */}
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-charcoal">
                Set Reminder Time
              </Text>
              <Text className="text-sm font-normal text-umber">
                Scroll or tap to choose the exact time.
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="p-2 -mr-2 active:opacity-70"
              accessibilityLabel="Close time picker">
              <Ionicons name="close" size={24} color="#6B645D" />
            </Pressable>
          </View>

          {/* Time Preview Card */}
          <View className="flex-row items-center justify-center py-3 px-4 rounded-2xl bg-surface border border-subtle-border gap-2.5">
            <Ionicons name="time" size={22} color="#3D5A50" />
            <Text className="text-2xl font-bold text-charcoal tracking-wide">
              {previewTime}
            </Text>
          </View>

          {/* Scrollable Pickers Container */}
          <View className="flex-row justify-between bg-canvas rounded-2xl border border-subtle-border p-2 h-[220px]">
            {/* Hour Column */}
            <View className="flex-1 items-center">
              <Text className="text-xs font-bold text-umber mb-1 uppercase tracking-wider">
                Hour
              </Text>
              <ScrollView
                ref={hourScrollRef}
                showsVerticalScrollIndicator={false}
                className="w-full"
                contentContainerStyle={{ paddingVertical: 4 }}>
                {HOURS.map((hour) => {
                  const isSelected = selectedHour === hour;
                  return (
                    <Pressable
                      key={hour}
                      onPress={() => setSelectedHour(hour)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`mx-1 rounded-xl items-center justify-center ${
                        isSelected
                          ? 'bg-sage border border-sage'
                          : 'bg-transparent'
                      }`}>
                      <Text
                        className={`text-lg ${
                          isSelected
                            ? 'font-bold text-white'
                            : 'font-semibold text-charcoal'
                        }`}>
                        {hour}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Separator Colon */}
            <View className="justify-center items-center px-1 pt-4">
              <Text className="text-2xl font-bold text-umber">:</Text>
            </View>

            {/* Minute Column */}
            <View className="flex-1 items-center">
              <Text className="text-xs font-bold text-umber mb-1 uppercase tracking-wider">
                Minute
              </Text>
              <ScrollView
                ref={minuteScrollRef}
                showsVerticalScrollIndicator={false}
                className="w-full"
                contentContainerStyle={{ paddingVertical: 4 }}>
                {MINUTES.map((minStr) => {
                  const isSelected = selectedMinute === minStr;
                  return (
                    <Pressable
                      key={minStr}
                      onPress={() => setSelectedMinute(minStr)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`mx-1 rounded-xl items-center justify-center ${
                        isSelected
                          ? 'bg-sage border border-sage'
                          : 'bg-transparent'
                      }`}>
                      <Text
                        className={`text-lg ${
                          isSelected
                            ? 'font-bold text-white'
                            : 'font-semibold text-charcoal'
                        }`}>
                        {minStr}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Period Column (AM / PM) */}
            <View className="flex-1 items-center">
              <Text className="text-xs font-bold text-umber mb-1 uppercase tracking-wider">
                Period
              </Text>
              <View className="w-full justify-center flex-1 gap-2 px-1">
                {PERIODS.map((p) => {
                  const isSelected = selectedPeriod === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setSelectedPeriod(p)}
                      style={{ height: ITEM_HEIGHT }}
                      className={`rounded-xl items-center justify-center ${
                        isSelected
                          ? 'bg-sage border border-sage'
                          : 'bg-surface border border-subtle-border'
                      }`}>
                      <Text
                        className={`text-base ${
                          isSelected
                            ? 'font-bold text-white'
                            : 'font-semibold text-charcoal'
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
        </View>
      </View>
    </Modal>
  );
};

