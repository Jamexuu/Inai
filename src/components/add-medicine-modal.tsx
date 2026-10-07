import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeSlot } from '@/types';
import { PrimaryButton } from './ui/primary-button';
import { medicineService } from '@/services/medicine.service';
import { useAppStore } from '@/store/app.store';

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TIME_SLOT_DEFAULTS: Record<TimeSlot, string> = {
  morning: '08:00',
  afternoon: '12:30',
  evening: '18:30',
  bedtime: '21:00',
};

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [reminderTime, setReminderTime] = useState(TIME_SLOT_DEFAULTS.morning);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setTimeSlot(slot);
    setReminderTime(TIME_SLOT_DEFAULTS[slot]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter the medicine name');
      return;
    }
    if (!dosage.trim()) {
      setError('Please enter the dosage (e.g. 500 mg or 1 tablet)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await medicineService.addMedicine({
        name: name.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim() || undefined,
        schedules: [
          {
            timeSlot,
            reminderTime,
          },
        ],
      });

      setName('');
      setDosage('');
      setInstructions('');
      setTimeSlot('morning');
      setReminderTime(TIME_SLOT_DEFAULTS.morning);

      triggerRefresh();
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      setError("Couldn't save medicine. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark max-h-[90%]">
          <ScrollView contentContainerClassName="p-4 gap-3">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-[22px] font-bold text-charcoal dark:text-charcoal-dark">
                Add New Medicine
              </Text>
              <Pressable onPress={onClose} className="p-2 active:opacity-70" accessibilityLabel="Close modal">
                <Ionicons name="close" size={24} color="#6B645D" />
              </Pressable>
            </View>

            {error ? (
              <View className="p-3 rounded-xl border border-brick bg-brick-tint dark:bg-brick-dark-tint dark:border-brick-dark">
                <Text className="text-sm font-semibold text-brick dark:text-brick-dark">{error}</Text>
              </View>
            ) : null}

            {/* Medicine Name */}
            <View className="gap-1.5">
              <Text className="text-base font-semibold text-charcoal dark:text-charcoal-dark">
                Medicine Name
              </Text>
              <TextInput
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 text-base text-charcoal dark:text-charcoal-dark"
                placeholder="e.g. Paracetamol, Losartan"
                placeholderTextColor="#8E867E"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Dosage */}
            <View className="gap-1.5">
              <Text className="text-base font-semibold text-charcoal dark:text-charcoal-dark">
                Dosage
              </Text>
              <TextInput
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 text-base text-charcoal dark:text-charcoal-dark"
                placeholder="e.g. 500 mg, 1 tablet, 2 capsules"
                placeholderTextColor="#8E867E"
                value={dosage}
                onChangeText={setDosage}
              />
            </View>

            {/* When to take */}
            <View className="gap-1.5">
              <Text className="text-base font-semibold text-charcoal dark:text-charcoal-dark">
                When to take
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(['morning', 'afternoon', 'evening', 'bedtime'] as TimeSlot[]).map((slot) => {
                  const isSelected = timeSlot === slot;
                  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleTimeSlotSelect(slot)}
                      className={`flex-1 min-w-[45%] min-h-[48px] rounded-xl border-[1.5px] items-center justify-center ${
                        isSelected
                          ? 'bg-sage border-sage active:bg-[#2E443C]'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-[15px] font-semibold ${
                          isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {slotLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Reminder Time */}
            <View className="gap-1.5">
              <Text className="text-base font-semibold text-charcoal dark:text-charcoal-dark">
                Reminder Time (HH:mm)
              </Text>
              <TextInput
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 text-base text-charcoal dark:text-charcoal-dark"
                placeholder="08:00"
                placeholderTextColor="#8E867E"
                value={reminderTime}
                onChangeText={setReminderTime}
              />
            </View>

            {/* Instructions */}
            <View className="gap-1.5">
              <Text className="text-base font-semibold text-charcoal dark:text-charcoal-dark">
                Instructions / Notes (Optional)
              </Text>
              <TextInput
                className="min-h-[80px] pt-3 rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 text-base text-charcoal dark:text-charcoal-dark"
                placeholder="e.g. Take with warm water after breakfast"
                placeholderTextColor="#8E867E"
                value={instructions}
                onChangeText={setInstructions}
                multiline={true}
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Actions */}
            <View className="gap-2.5 mt-2">
              <PrimaryButton
                label={isSubmitting ? 'Saving...' : 'Save Medicine'}
                variant="primary"
                disabled={isSubmitting}
                onPress={handleSave}
                className="min-h-[56px]"
              />
              <PrimaryButton
                label="Cancel"
                variant="outline"
                onPress={onClose}
                className="min-h-[48px]"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
