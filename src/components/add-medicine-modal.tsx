import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicineWithSchedules, TimeSlot } from '@/types';
import { PrimaryButton } from './ui/primary-button';
import { medicineService } from '@/services/medicine.service';
import { useAppStore } from '@/store/app.store';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'existing' | 'new';
}

const TIME_SLOT_DEFAULTS: Record<TimeSlot, string> = {
  morning: '8:00 AM',
  afternoon: '12:30 PM',
  evening: '6:30 PM',
  bedtime: '9:00 PM',
};

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialMode = 'existing',
}) => {
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const [existingMedicines, setExistingMedicines] = useState<MedicineWithSchedules[]>([]);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);

  // New medicine form fields
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');

  // Schedule fields
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [reminderTime, setReminderTime] = useState(TIME_SLOT_DEFAULTS.morning);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing medicines whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      setError(null);
      medicineService.getAllMedicines().then((meds) => {
        setExistingMedicines(meds);
        if (meds.length > 0) {
          setMode(initialMode);
          setSelectedMedicineId(meds[0].id);
        } else {
          setMode('new');
        }
      });
    }
  }, [visible, initialMode]);

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setTimeSlot(slot);
    setReminderTime(TIME_SLOT_DEFAULTS[slot]);
  };

  const handleSave = async () => {
    setError(null);

    const canonicalReminderTime = parseTo24Hour(reminderTime);

    if (mode === 'existing') {
      if (!selectedMedicineId) {
        setError('Please select a medicine from your cabinet');
        return;
      }

      setIsSubmitting(true);
      try {
        await medicineService.addScheduleToMedicine({
          medicineId: selectedMedicineId,
          timeSlot,
          reminderTime: canonicalReminderTime,
        });

        triggerRefresh();
        onSuccess();
        onClose();
      } catch (e) {
        console.error(e);
        setError("Couldn't add reminder. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Mode === 'new'
      if (!name.trim()) {
        setError('Please enter the medicine name');
        return;
      }
      if (!dosage.trim()) {
        setError('Please enter the dosage (e.g. 500 mg or 1 tablet)');
        return;
      }

      setIsSubmitting(true);
      try {
        await medicineService.addMedicine({
          name: name.trim(),
          dosage: dosage.trim(),
          instructions: instructions.trim() || undefined,
          schedules: [
            {
              timeSlot,
              reminderTime: canonicalReminderTime,
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
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border bg-card max-h-[90%]">
          <ScrollView contentContainerClassName="p-4 pb-12 gap-3.5">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-[22px] font-bold text-charcoal">
                {mode === 'existing' ? "Add to Today's Routine" : 'Add New Medicine'}
              </Text>
              <Pressable onPress={onClose} className="p-2 active:opacity-70" accessibilityLabel="Close modal">
                <Ionicons name="close" size={24} color="#6B645D" />
              </Pressable>
            </View>

            {/* Mode Switcher (Visible when user already has medicines registered) */}
            {existingMedicines.length > 0 && (
              <View className="flex-row rounded-xl bg-surface p-1 border border-subtle-border">
                <Pressable
                  onPress={() => {
                    setMode('existing');
                    setError(null);
                  }}
                  className={`flex-1 min-h-[44px] rounded-lg items-center justify-center ${
                    mode === 'existing' ? 'bg-sage' : 'bg-transparent'
                  }`}>
                  <Text
                    className={`text-[15px] font-bold ${
                      mode === 'existing' ? 'text-white' : 'text-charcoal'
                    }`}>
                    From Cabinet ({existingMedicines.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMode('new');
                    setError(null);
                  }}
                  className={`flex-1 min-h-[44px] rounded-lg items-center justify-center ${
                    mode === 'new' ? 'bg-sage' : 'bg-transparent'
                  }`}>
                  <Text
                    className={`text-[15px] font-bold ${
                      mode === 'new' ? 'text-white' : 'text-charcoal'
                    }`}>
                    + New Medicine
                  </Text>
                </Pressable>
              </View>
            )}

            {error ? (
              <View className="p-3 rounded-xl border border-brick bg-brick-tint">
                <Text className="text-sm font-semibold text-brick">{error}</Text>
              </View>
            ) : null}

            {/* Existing Medicine Selection Mode */}
            {mode === 'existing' ? (
              <View className="gap-2.5">
                <Text className="text-base font-semibold text-charcoal">
                  Select Medicine from Cabinet
                </Text>
                <View className="gap-2">
                  {existingMedicines.map((med) => {
                    const isSelected = selectedMedicineId === med.id;
                    return (
                      <Pressable
                        key={med.id}
                        onPress={() => setSelectedMedicineId(med.id)}
                        className={`p-3.5 rounded-xl border-[1.5px] ${
                          isSelected
                            ? 'bg-sage-tint border-sage'
                            : 'bg-surface border-subtle-border active:bg-card-selected'
                        }`}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 gap-0.5">
                            <Text className="text-lg font-bold text-charcoal">
                              {med.name}
                            </Text>
                            <Text className="text-[15px] font-semibold text-terracotta">
                              {med.dosage}
                            </Text>
                            {med.instructions ? (
                              <Text className="text-xs text-umber mt-0.5">
                                {med.instructions}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={24}
                            color={isSelected ? '#3D5A50' : '#8E867E'}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* New Medicine Mode */
              <>
                {/* Medicine Name */}
                <View className="gap-1.5">
                  <Text className="text-base font-semibold text-charcoal">
                    Medicine Name
                  </Text>
                  <TextInput
                    className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-4 text-base text-charcoal"
                    placeholder="e.g. Paracetamol, Losartan"
                    placeholderTextColor="#8E867E"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Dosage */}
                <View className="gap-1.5">
                  <Text className="text-base font-semibold text-charcoal">
                    Dosage
                  </Text>
                  <TextInput
                    className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-4 text-base text-charcoal"
                    placeholder="e.g. 500 mg, 1 tablet, 2 capsules"
                    placeholderTextColor="#8E867E"
                    value={dosage}
                    onChangeText={setDosage}
                  />
                </View>

                {/* Instructions */}
                <View className="gap-1.5">
                  <Text className="text-base font-semibold text-charcoal">
                    Instructions / Notes (Optional)
                  </Text>
                  <TextInput
                    className="min-h-[80px] pt-3 rounded-xl border-[1.5px] border-subtle-border bg-surface px-4 text-base text-charcoal"
                    placeholder="e.g. Take with warm water after breakfast"
                    placeholderTextColor="#8E867E"
                    value={instructions}
                    onChangeText={setInstructions}
                    multiline={true}
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}

            {/* Schedule Fields (Common to both modes) */}
            <View className="gap-2 mt-1">
              <Text className="text-base font-semibold text-charcoal">
                When to take
              </Text>
              {/* Row 1: Morning & Afternoon */}
              <View className="flex-row gap-2.5">
                {(['morning', 'afternoon'] as TimeSlot[]).map((slot) => {
                  const isSelected = timeSlot === slot;
                  const slotLabel = slot === 'morning' ? 'Morning' : 'Afternoon';
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleTimeSlotSelect(slot)}
                      className={`flex-1 py-3 px-2 rounded-xl border-[1.5px] items-center justify-center ${
                        isSelected
                          ? 'bg-sage border-sage active:bg-[#2E443C]'
                          : 'bg-surface border-subtle-border active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-[15px] font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal'
                        }`}>
                        {slotLabel}
                      </Text>
                      <Text
                        className={`text-xs mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-umber'
                        }`}>
                        {TIME_SLOT_DEFAULTS[slot]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Row 2: Evening & Bedtime */}
              <View className="flex-row gap-2.5">
                {(['evening', 'bedtime'] as TimeSlot[]).map((slot) => {
                  const isSelected = timeSlot === slot;
                  const slotLabel = slot === 'evening' ? 'Evening' : 'Bedtime';
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleTimeSlotSelect(slot)}
                      className={`flex-1 py-3 px-2 rounded-xl border-[1.5px] items-center justify-center ${
                        isSelected
                          ? 'bg-sage border-sage active:bg-[#2E443C]'
                          : 'bg-surface border-subtle-border active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-[15px] font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal'
                        }`}>
                        {slotLabel}
                      </Text>
                      <Text
                        className={`text-xs mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-umber'
                        }`}>
                        {TIME_SLOT_DEFAULTS[slot]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Reminder Time */}
            <View className="gap-1.5">
              <Text className="text-base font-semibold text-charcoal">
                Reminder Time
              </Text>
              <TextInput
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-4 text-base text-charcoal font-medium"
                placeholder="8:00 AM"
                placeholderTextColor="#8E867E"
                value={reminderTime}
                onChangeText={setReminderTime}
              />
            </View>

            {/* Actions */}
            <View className="gap-2.5 mt-2">
              <PrimaryButton
                label={
                  isSubmitting
                    ? 'Saving...'
                    : mode === 'existing'
                    ? "Add to Today's Routine"
                    : 'Save New Medicine'
                }
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
