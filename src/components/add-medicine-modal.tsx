import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MedicineWithSchedules, TimeSlot } from '@/types';
import { PrimaryButton, ScrollableTimePickerModal } from './ui';
import { medicineService } from '@/services/medicine.service';
import { useAppStore } from '@/store/app.store';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';

interface AddMedicineModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMode?: 'existing' | 'new';
  initialMedicine?: MedicineWithSchedules | null;
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
  initialMedicine,
}) => {
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const isEditing = !!initialMedicine;

  const [existingMedicines, setExistingMedicines] = useState<MedicineWithSchedules[]>([]);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');

  // Schedule fields
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('morning');
  const [reminderTime, setReminderTime] = useState(TIME_SLOT_DEFAULTS.morning);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setError(null);
      if (initialMedicine) {
        setMode('new');
        setName(initialMedicine.name);
        setDosage(initialMedicine.dosage);
        setInstructions(initialMedicine.instructions || '');
        setNotes(initialMedicine.notes || '');
        if (initialMedicine.schedules && initialMedicine.schedules.length > 0) {
          const firstSched = initialMedicine.schedules[0];
          setTimeSlot(firstSched.timeSlot);
          setReminderTime(formatTo12Hour(firstSched.reminderTime));
        } else {
          setTimeSlot('morning');
          setReminderTime(TIME_SLOT_DEFAULTS.morning);
        }
      } else {
        medicineService.getAllMedicines().then((meds) => {
          setExistingMedicines(meds);
          if (meds.length > 0) {
            setMode(initialMode);
            setSelectedMedicineId(meds[0].id);
          } else {
            setMode('new');
          }
        });
        setName('');
        setDosage('');
        setInstructions('');
        setNotes('');
        setTimeSlot('morning');
        setReminderTime(TIME_SLOT_DEFAULTS.morning);
      }
    }
  }, [visible, initialMode, initialMedicine]);

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setTimeSlot(slot);
    setReminderTime(TIME_SLOT_DEFAULTS[slot]);
  };

  const handleSave = async () => {
    setError(null);
    const canonicalReminderTime = parseTo24Hour(reminderTime);

    // Edit Mode
    if (isEditing && initialMedicine) {
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
        await medicineService.updateMedicine(
          {
            ...initialMedicine,
            name: name.trim(),
            dosage: dosage.trim(),
            instructions: instructions.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          [
            {
              timeSlot,
              reminderTime: canonicalReminderTime,
            },
          ]
        );

        triggerRefresh();
        onSuccess();
        onClose();
      } catch (e) {
        console.error(e);
        setError("Couldn't update medicine. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Add Mode (from cabinet or new)
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
          notes: notes.trim() || undefined,
          schedules: [
            {
              timeSlot,
              reminderTime: canonicalReminderTime,
            },
          ],
        });

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

  const handleDelete = () => {
    if (!initialMedicine) return;

    Alert.alert(
      'Delete Medicine',
      `Are you sure you want to remove ${initialMedicine.name}? All scheduled alarms for this medicine will be cancelled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await medicineService.deleteMedicine(initialMedicine.id);
              triggerRefresh();
              onSuccess();
              onClose();
            } catch (e) {
              console.error(e);
              setError("Couldn't delete medicine. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/60 justify-end">
        <View className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border bg-card max-h-[92%]">
          <ScrollView
            contentContainerClassName="px-3.5 py-4 pb-12 gap-3"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row justify-between items-start mb-0.5">
              <View className="flex-1 pr-2">
                <Text className="text-xl font-bold text-charcoal">
                  {isEditing
                    ? 'Edit Medicine'
                    : mode === 'existing'
                    ? "Add to Today's Routine"
                    : 'Add New Medicine'}
                </Text>
                <Text className="text-xs font-normal text-umber mt-0.5">
                  {isEditing
                    ? 'Update prescription details or reminder time.'
                    : mode === 'existing'
                    ? 'Choose an existing medicine to schedule.'
                    : 'Schedule a new prescription alarm.'}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-1.5 -mr-1.5 active:opacity-70" accessibilityLabel="Close modal">
                <Ionicons name="close" size={24} color="#6B645D" />
              </Pressable>
            </View>

            {/* Mode Switcher (Visible only when adding and user already has medicines) */}
            {!isEditing && existingMedicines.length > 0 && (
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
                    From Cabinet
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
                    New Medicine
                  </Text>
                </Pressable>
              </View>
            )}

            {error ? (
              <View className="p-2.5 rounded-xl border border-brick bg-brick-tint">
                <Text className="text-xs font-semibold text-brick">{error}</Text>
              </View>
            ) : null}

            {/* Existing Medicine Selection Mode */}
            {!isEditing && mode === 'existing' ? (
              <View className="gap-2.5">
                <Text className="text-xs font-bold text-charcoal px-0.5">
                  Select Medicine from Cabinet
                </Text>
                <View className="gap-2">
                  {existingMedicines.map((med) => {
                    const isSelected = selectedMedicineId === med.id;
                    return (
                      <Pressable
                        key={med.id}
                        onPress={() => setSelectedMedicineId(med.id)}
                        className={`p-3 rounded-xl border-[1.5px] ${
                          isSelected
                            ? 'bg-sage-tint border-sage'
                            : 'bg-surface border-subtle-border active:bg-card-selected'
                        }`}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 gap-0.5">
                            <Text className="text-base font-bold text-charcoal">
                              {med.name}
                            </Text>
                            <Text className="text-sm font-semibold text-terracotta">
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
                            size={22}
                            color={isSelected ? '#3D5A50' : '#8E867E'}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* New / Edit Medicine Form */
              <View className="gap-3">
                <View className="gap-1">
                  <Text className="text-xs font-bold text-charcoal px-0.5">
                    Medicine Name
                  </Text>
                  <TextInput
                    className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 text-base text-charcoal font-medium"
                    placeholder="e.g. Paracetamol, Losartan"
                    placeholderTextColor="#8E867E"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-xs font-bold text-charcoal px-0.5">
                    Dosage
                  </Text>
                  <TextInput
                    className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 text-base text-charcoal font-medium"
                    placeholder="e.g. 500 mg, 1 tablet"
                    placeholderTextColor="#8E867E"
                    value={dosage}
                    onChangeText={setDosage}
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-xs font-bold text-charcoal px-0.5">
                    Instructions (Optional)
                  </Text>
                  <TextInput
                    className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 text-sm text-charcoal font-medium"
                    placeholder="e.g. Take after breakfast with water"
                    placeholderTextColor="#8E867E"
                    value={instructions}
                    onChangeText={setInstructions}
                  />
                </View>

                <View className="gap-1">
                  <Text className="text-xs font-bold text-charcoal px-0.5">
                    Notes (Optional)
                  </Text>
                  <TextInput
                    className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 text-sm text-charcoal font-medium"
                    placeholder="e.g. Maintenance for blood pressure"
                    placeholderTextColor="#8E867E"
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>
              </View>
            )}

            {/* Time Slot Selector */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Time of Day
              </Text>
              {/* Row 1: Morning & Afternoon */}
              <View className="flex-row gap-2">
                {(['morning', 'afternoon'] as TimeSlot[]).map((slot) => {
                  const isSelected = timeSlot === slot;
                  const slotLabel = slot === 'morning' ? 'Morning' : 'Afternoon';
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleTimeSlotSelect(slot)}
                      className={`flex-1 py-2.5 px-2 rounded-xl border-[1.5px] items-center justify-center ${
                        isSelected
                          ? 'bg-sage border-sage active:bg-[#2E443C]'
                          : 'bg-surface border-subtle-border active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal'
                        }`}>
                        {slotLabel}
                      </Text>
                      <Text
                        className={`text-[11px] mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-umber'
                        }`}>
                        {TIME_SLOT_DEFAULTS[slot]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Row 2: Evening & Bedtime */}
              <View className="flex-row gap-2">
                {(['evening', 'bedtime'] as TimeSlot[]).map((slot) => {
                  const isSelected = timeSlot === slot;
                  const slotLabel = slot === 'evening' ? 'Evening' : 'Bedtime';
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => handleTimeSlotSelect(slot)}
                      className={`flex-1 py-2.5 px-2 rounded-xl border-[1.5px] items-center justify-center ${
                        isSelected
                          ? 'bg-sage border-sage active:bg-[#2E443C]'
                          : 'bg-surface border-subtle-border active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal'
                        }`}>
                        {slotLabel}
                      </Text>
                      <Text
                        className={`text-[11px] mt-0.5 font-medium ${
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
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Exact Reminder Time
              </Text>
              <Pressable
                onPress={() => setIsTimePickerOpen(true)}
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 flex-row items-center justify-between active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel={`Reminder time: ${reminderTime}. Tap to choose a different time.`}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color="#3D5A50" />
                  <Text className="text-base font-bold text-charcoal">
                    {reminderTime || '8:00 AM'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-semibold text-umber">Change</Text>
                  <Ionicons name="chevron-forward" size={15} color="#8E867E" />
                </View>
              </Pressable>
            </View>

            {/* Actions */}
            <View className="gap-2 mt-1">
              <PrimaryButton
                label={
                  isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Save Changes'
                    : mode === 'existing'
                    ? "Add to Today's Routine"
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
        </View>
      </KeyboardAvoidingView>

      {/* Scrollable Time Picker Modal */}
      <ScrollableTimePickerModal
        visible={isTimePickerOpen}
        value={reminderTime}
        onConfirm={(newTime) => setReminderTime(newTime)}
        onClose={() => setIsTimePickerOpen(false)}
      />
    </Modal>
  );
};
