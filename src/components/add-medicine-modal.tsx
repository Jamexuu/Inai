import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicineWithSchedules, TimeSlot } from '@/types';
import { PrimaryButton, ScrollableTimePickerModal, ConfirmationDialog, ScalePressable } from './ui';
import { medicineService } from '@/services/medicine.service';
import { useAppStore } from '@/store/app.store';
import {
  formatTo12Hour,
  parseTo24Hour,
  ALL_DAYS,
  WEEKDAYS,
  WEEKENDS,
  DAY_LABELS,
  DayCode,
  parseDaysOfWeekString,
  serializeDaysOfWeek,
  formatDaysOfWeekSummary,
} from '@/utils/date.utils';
import { useTheme } from '@/hooks/use-theme';

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMedicine?: MedicineWithSchedules | null;
}

const TIME_SLOT_DEFAULTS: Record<TimeSlot, string> = {
  morning: '8:00 AM',
  afternoon: '12:30 PM',
  evening: '6:30 PM',
  bedtime: '9:00 PM',
};

const TIME_SLOT_CONFIGS: Array<{
  slot: TimeSlot;
  label: string;
  subtitle: string;
  defaultTime: string;
  icon: 'sunny-outline' | 'restaurant-outline' | 'moon-outline' | 'bed-outline';
}> = [
  {
    slot: 'morning',
    label: 'Morning',
    subtitle: 'After Breakfast',
    defaultTime: '8:00 AM',
    icon: 'sunny-outline',
  },
  {
    slot: 'afternoon',
    label: 'Afternoon',
    subtitle: 'After Lunch',
    defaultTime: '12:30 PM',
    icon: 'restaurant-outline',
  },
  {
    slot: 'evening',
    label: 'Evening',
    subtitle: 'After Dinner',
    defaultTime: '6:30 PM',
    icon: 'moon-outline',
  },
  {
    slot: 'bedtime',
    label: 'Bedtime',
    subtitle: 'Before Sleep',
    defaultTime: '9:00 PM',
    icon: 'bed-outline',
  },
];

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialMedicine,
}) => {
  const colors = useTheme();
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const isEditing = !!initialMedicine;

  // Form fields
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  // Schedule fields
  const [selectedDays, setSelectedDays] = useState<DayCode[]>(ALL_DAYS);
  const [selectedSlotTimes, setSelectedSlotTimes] = useState<Record<TimeSlot, string | null>>({
    morning: '8:00 AM',
    afternoon: null,
    evening: null,
    bedtime: null,
  });

  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setError(null);
      if (initialMedicine) {
        setName(initialMedicine.name);
        setDosage(initialMedicine.dosage);
        setInstructions(initialMedicine.instructions || '');
        setNotes(initialMedicine.notes || '');

        const initialTimes: Record<TimeSlot, string | null> = {
          morning: null,
          afternoon: null,
          evening: null,
          bedtime: null,
        };

        if (initialMedicine.schedules && initialMedicine.schedules.length > 0) {
          for (const s of initialMedicine.schedules) {
            initialTimes[s.timeSlot] = formatTo12Hour(s.reminderTime);
          }
          setSelectedDays(parseDaysOfWeekString(initialMedicine.schedules[0].daysOfWeek));
        } else {
          initialTimes.morning = '8:00 AM';
          setSelectedDays(ALL_DAYS);
        }

        if (!Object.values(initialTimes).some(Boolean)) {
          initialTimes.morning = '8:00 AM';
        }

        setSelectedSlotTimes(initialTimes);
      } else {
        setName('');
        setDosage('');
        setInstructions('');
        setNotes('');
        setSelectedDays(ALL_DAYS);
        setSelectedSlotTimes({
          morning: '8:00 AM',
          afternoon: null,
          evening: null,
          bedtime: null,
        });
      }
    }
  }, [visible, initialMedicine]);

  const handleToggleDay = (day: DayCode) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        setError('Please select at least one day for this medicine.');
        return;
      }
      setError(null);
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setError(null);
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleToggleSlot = (slot: TimeSlot) => {
    const isCurrentlySelected = selectedSlotTimes[slot] !== null;
    if (isCurrentlySelected) {
      const activeCount = Object.values(selectedSlotTimes).filter(Boolean).length;
      if (activeCount === 1) {
        setError('Please select at least one time of day for this medicine.');
        return;
      }
      setError(null);
      setSelectedSlotTimes((prev) => ({ ...prev, [slot]: null }));
    } else {
      setError(null);
      const defaultTime = TIME_SLOT_DEFAULTS[slot];
      setSelectedSlotTimes((prev) => ({ ...prev, [slot]: defaultTime }));
    }
  };

  const handleOpenTimePicker = (slot: TimeSlot) => {
    setEditingTimeSlot(slot);
    setIsTimePickerOpen(true);
  };

  const isEveryDay = selectedDays.length === 7;
  const isWeekdays = selectedDays.length === 5 && WEEKDAYS.every((d) => selectedDays.includes(d));
  const isWeekends = selectedDays.length === 2 && WEEKENDS.every((d) => selectedDays.includes(d));
  const serializedDays = serializeDaysOfWeek(selectedDays);
  const selectedSlotsCount = Object.values(selectedSlotTimes).filter(Boolean).length;

  const handleSave = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Please enter medicine name');
      return;
    }
    if (!dosage.trim()) {
      setError('Please enter dosage (e.g. 500 mg)');
      return;
    }

    const activeSlots = (Object.keys(selectedSlotTimes) as TimeSlot[]).filter(
      (slot) => selectedSlotTimes[slot] !== null
    );

    if (activeSlots.length === 0) {
      setError('Please select at least one time of day.');
      return;
    }

    const schedulesPayload = activeSlots.map((slot) => ({
      timeSlot: slot,
      reminderTime: parseTo24Hour(selectedSlotTimes[slot]!),
      daysOfWeek: serializedDays,
    }));

    setIsSubmitting(true);
    try {
      if (isEditing && initialMedicine) {
        await medicineService.updateMedicine(
          {
            ...initialMedicine,
            name: name.trim(),
            dosage: dosage.trim(),
            instructions: instructions.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          schedulesPayload
        );
      } else {
        await medicineService.addMedicine({
          name: name.trim(),
          dosage: dosage.trim(),
          instructions: instructions.trim() || undefined,
          notes: notes.trim() || undefined,
          schedules: schedulesPayload,
        });
      }

      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      setError("Couldn't save medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialMedicine) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!initialMedicine) return;
    setIsSubmitting(true);
    try {
      await medicineService.deleteMedicine(initialMedicine.id);
      triggerRefresh();
      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      setError("Couldn't delete medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-end">
        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: colors.backgroundCard }}
          className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark max-h-[92%]">
          <ScrollView
            contentContainerClassName="px-3.5 py-4 pb-12 gap-3"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row justify-between items-start mb-0.5">
              <View className="flex-1 pr-2">
                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  {isEditing ? 'Edit Medicine' : 'Add New Medicine'}
                </Text>
                <Text className="text-sm font-medium text-umber dark:text-umber-dark mt-0.5">
                  {isEditing
                    ? 'Update prescription details or reminder schedule.'
                    : 'Register a prescription and set your reminder schedule.'}
                </Text>
              </View>
              <ScalePressable
                onPress={onClose}
                scaleTo={0.9}
                className="min-w-[44px] min-h-[44px] items-center justify-center -mr-1.5 active:opacity-70"
                accessibilityLabel="Close modal"
                accessibilityRole="button">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </ScalePressable>
            </View>

            {error ? (
              <View className="p-2.5 rounded-xl border border-brick dark:border-brick-dark bg-brick-tint dark:bg-brick-dark-tint">
                <Text className="text-xs font-semibold text-brick dark:text-brick-dark">{error}</Text>
              </View>
            ) : null}

            {/* Medicine Form */}
            <View className="gap-3">
              <View className="gap-1">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                  Medicine Name
                </Text>
                <TextInput
                  className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 text-base text-charcoal dark:text-charcoal-dark font-medium"
                  placeholder="e.g. Paracetamol, Losartan"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                  Dosage
                </Text>
                <TextInput
                  className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 text-base text-charcoal dark:text-charcoal-dark font-medium"
                  placeholder="e.g. 500 mg, 1 tablet"
                  placeholderTextColor={colors.textMuted}
                  value={dosage}
                  onChangeText={setDosage}
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                  Instructions (Optional)
                </Text>
                <TextInput
                  className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 text-sm text-charcoal dark:text-charcoal-dark font-medium"
                  placeholder="e.g. Take after breakfast with water"
                  placeholderTextColor={colors.textMuted}
                  value={instructions}
                  onChangeText={setInstructions}
                />
              </View>

              <View className="gap-1">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                  Notes (Optional)
                </Text>
                <TextInput
                  className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 text-sm text-charcoal dark:text-charcoal-dark font-medium"
                  placeholder="e.g. Maintenance for blood pressure"
                  placeholderTextColor={colors.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>

            {/* Days of Week Selector */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between px-0.5">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                  Days to Take
                </Text>
                <Text className="text-xs font-bold text-sage dark:text-sage-dark">
                  {formatDaysOfWeekSummary(serializedDays)}
                </Text>
              </View>

              {/* Quick Presets */}
              <View className="flex-row gap-2">
                <ScalePressable
                  onPress={() => {
                    setError(null);
                    setSelectedDays(ALL_DAYS);
                  }}
                  scaleTo={0.92}
                  className={`flex-1 py-2 px-1 rounded-xl border-[1.5px] items-center justify-center min-h-[44px] ${
                    isEveryDay
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isEveryDay ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    Every Day
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => {
                    setError(null);
                    setSelectedDays(WEEKDAYS);
                  }}
                  scaleTo={0.92}
                  className={`flex-1 py-2 px-1 rounded-xl border-[1.5px] items-center justify-center min-h-[44px] ${
                    isWeekdays
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isWeekdays ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    Weekdays
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => {
                    setError(null);
                    setSelectedDays(WEEKENDS);
                  }}
                  scaleTo={0.92}
                  className={`flex-1 py-2 px-1 rounded-xl border-[1.5px] items-center justify-center min-h-[44px] ${
                    isWeekends
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isWeekends ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    Weekends
                  </Text>
                </ScalePressable>
              </View>

              {/* Individual 7 Day Chips */}
              <View className="flex-row justify-between gap-1 mt-0.5">
                {ALL_DAYS.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  const label = DAY_LABELS[day];
                  return (
                    <ScalePressable
                      key={day}
                      onPress={() => handleToggleDay(day)}
                      scaleTo={0.9}
                      className={`flex-1 min-h-[44px] py-1.5 rounded-xl border-[1.5px] items-center justify-center ${
                        isSelected
                          ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                      }`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={`${label.full}, ${isSelected ? 'selected' : 'not selected'}`}>
                      <Text
                        className={`text-[13px] font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {label.short}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </View>
            </View>

            {/* Times of Day Section (Supports Multiple Times e.g. 3x a day) */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between px-0.5">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                  Time of Day
                </Text>
                <Text className="text-xs font-bold text-sage dark:text-sage-dark">
                  {selectedSlotsCount === 1 ? 'Once a day' : `${selectedSlotsCount}x a day`}
                </Text>
              </View>

              <View className="gap-2">
                {TIME_SLOT_CONFIGS.map((slotConfig) => {
                  const isSelected = selectedSlotTimes[slotConfig.slot] !== null;
                  const currentTime = selectedSlotTimes[slotConfig.slot] || slotConfig.defaultTime;

                  return (
                    <View
                      key={slotConfig.slot}
                      className={`p-3 rounded-2xl border-[1.5px] ${
                        isSelected
                          ? 'bg-sage-tint/35 dark:bg-sage-dark-tint/35 border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                      }`}>
                      <View className="flex-row items-center justify-between">
                        {/* Slot Toggle Checkbox & Label */}
                        <ScalePressable
                          onPress={() => handleToggleSlot(slotConfig.slot)}
                          scaleTo={0.96}
                          className="flex-row items-center gap-2.5 flex-1 pr-2 min-h-[44px]"
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={`${slotConfig.label}, ${slotConfig.subtitle}. ${
                            isSelected ? 'Selected' : 'Not selected'
                          }`}>
                          <Ionicons
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isSelected ? colors.primary : colors.textMuted}
                          />
                          <View className="flex-1">
                            <Text
                              className={`text-[15px] font-bold ${
                                isSelected
                                  ? 'text-charcoal dark:text-charcoal-dark'
                                  : 'text-umber dark:text-umber-dark'
                              }`}>
                              {slotConfig.label}
                            </Text>
                            <Text className="text-xs font-medium text-umber dark:text-umber-dark">
                              {slotConfig.subtitle}
                            </Text>
                          </View>
                        </ScalePressable>

                        {/* Exact Time Button */}
                        {isSelected ? (
                          <ScalePressable
                            onPress={() => handleOpenTimePicker(slotConfig.slot)}
                            scaleTo={0.92}
                            className="min-h-[44px] px-3 py-1.5 rounded-xl border border-sage/40 dark:border-sage-dark/40 bg-card dark:bg-card-dark flex-row items-center gap-1.5 active:bg-card-selected"
                            accessibilityRole="button"
                            accessibilityLabel={`Reminder time for ${slotConfig.label}: ${currentTime}. Tap to change.`}>
                            <Ionicons name="time-outline" size={15} color={colors.primary} />
                            <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
                              {currentTime}
                            </Text>
                            <Ionicons name="pencil" size={13} color={colors.textSecondary} />
                          </ScalePressable>
                        ) : (
                          <ScalePressable
                            onPress={() => handleToggleSlot(slotConfig.slot)}
                            scaleTo={0.92}
                            className="min-h-[44px] px-2.5 py-1.5 items-center justify-center opacity-60"
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${slotConfig.label} routine at ${slotConfig.defaultTime}`}>
                            <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                              +{slotConfig.defaultTime}
                            </Text>
                          </ScalePressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Actions */}
            <View className="gap-2 mt-1">
              <PrimaryButton
                label={
                  isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Save Changes'
                    : 'Save New Medicine'
                }
                variant="primary"
                disabled={isSubmitting}
                onPress={handleSave}
                className="min-h-[50px]"
              />

              {isEditing ? (
                <View className="flex-row gap-2">
                  <PrimaryButton
                    label="Delete"
                    icon={<Ionicons name="trash-outline" size={16} color="#B84233" />}
                    variant="danger"
                    onPress={handleDelete}
                    className="flex-1 min-h-[46px]"
                  />
                  <PrimaryButton
                    label="Cancel"
                    variant="outline"
                    onPress={onClose}
                    className="flex-1 min-h-[46px]"
                  />
                </View>
              ) : (
                <PrimaryButton
                  label="Cancel"
                  variant="outline"
                  onPress={onClose}
                  className="min-h-[46px]"
                />
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Scrollable Time Picker Modal */}
      <ScrollableTimePickerModal
        visible={isTimePickerOpen}
        value={
          editingTimeSlot
            ? selectedSlotTimes[editingTimeSlot] || TIME_SLOT_DEFAULTS[editingTimeSlot]
            : '8:00 AM'
        }
        onConfirm={(newTime) => {
          if (editingTimeSlot) {
            setSelectedSlotTimes((prev) => ({ ...prev, [editingTimeSlot]: newTime }));
          }
          setIsTimePickerOpen(false);
        }}
        onClose={() => setIsTimePickerOpen(false)}
      />

      {/* Simple Confirmation Modal for Deletion */}
      <ConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete medicine?"
        message={`Delete ${initialMedicine?.name}? Reminders for this medicine will also be cancelled.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Modal>
  );
};
