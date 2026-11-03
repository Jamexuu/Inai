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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MedicineWithSchedules, TimeSlot } from '@/types';
import { PrimaryButton, ScrollableTimePickerModal } from './ui';
import { medicineService } from '@/services/medicine.service';
import { useAppStore } from '@/store/app.store';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { useTheme } from '@/hooks/use-theme';

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
  const colors = useTheme();
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
          const s = initialMedicine.schedules[0];
          setTimeSlot(s.timeSlot);
          setReminderTime(formatTo12Hour(s.reminderTime));
        } else {
          setTimeSlot('morning');
          setReminderTime(TIME_SLOT_DEFAULTS.morning);
        }
      } else {
        // Load cabinet medicines to check if user has existing ones
        medicineService.getAllMedicines().then((meds) => {
          setExistingMedicines(meds);
          if (meds.length > 0 && initialMode === 'existing') {
            setMode('existing');
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
  }, [visible, initialMedicine, initialMode]);

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
        setError('Please enter medicine name');
        return;
      }
      if (!dosage.trim()) {
        setError('Please enter dosage');
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
        setError("Couldn't save changes. Please try again.");
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
        setError('Please enter medicine name');
        return;
      }
      if (!dosage.trim()) {
        setError('Please enter dosage (e.g. 500 mg)');
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
      `Are you sure you want to delete ${initialMedicine.name}? All scheduled reminders for this medicine will also be cancelled.`,
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
                  {isEditing
                    ? 'Edit Medicine'
                    : mode === 'existing'
                    ? "Add to Today's Routine"
                    : 'Add New Medicine'}
                </Text>
                <Text className="text-sm font-medium text-umber dark:text-umber-dark mt-0.5">
                  {isEditing
                    ? 'Update prescription details or reminder time.'
                    : mode === 'existing'
                    ? 'Choose an existing medicine to schedule.'
                    : 'Schedule a new prescription reminder.'}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="min-w-[44px] min-h-[44px] items-center justify-center -mr-1.5 active:opacity-70"
                accessibilityLabel="Close modal"
                accessibilityRole="button">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Mode Switcher (Visible only when adding and user already has medicines) */}
            {!isEditing && existingMedicines.length > 0 && (
              <View className="flex-row rounded-xl bg-surface dark:bg-surface-dark p-1 border border-subtle-border dark:border-subtle-border-dark">
                <Pressable
                  onPress={() => {
                    setMode('existing');
                    setError(null);
                  }}
                  className={`flex-1 min-h-[44px] rounded-lg items-center justify-center ${
                    mode === 'existing' ? 'bg-sage dark:bg-sage-dark' : 'bg-transparent'
                  }`}>
                  <Text
                    className={`text-[15px] font-bold ${
                      mode === 'existing' ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
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
                    mode === 'new' ? 'bg-sage dark:bg-sage-dark' : 'bg-transparent'
                  }`}>
                  <Text
                    className={`text-[15px] font-bold ${
                      mode === 'new' ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    New Medicine
                  </Text>
                </Pressable>
              </View>
            )}

            {error ? (
              <View className="p-2.5 rounded-xl border border-brick dark:border-brick-dark bg-brick-tint dark:bg-brick-dark-tint">
                <Text className="text-xs font-semibold text-brick dark:text-brick-dark">{error}</Text>
              </View>
            ) : null}

            {/* Existing Medicine Selection Mode */}
            {!isEditing && mode === 'existing' ? (
              <View className="gap-2.5">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
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
                            ? 'bg-sage-tint dark:bg-sage-dark-tint border-sage dark:border-sage-dark'
                            : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                        }`}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 gap-0.5">
                            <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                              {med.name}
                            </Text>
                            <Text className="text-sm font-semibold text-terracotta dark:text-terracotta-dark">
                              {med.dosage}
                            </Text>
                            {med.instructions ? (
                              <Text className="text-xs text-umber dark:text-umber-dark mt-0.5">
                                {med.instructions}
                              </Text>
                            ) : null}
                          </View>
                          <Ionicons
                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                            size={22}
                            color={isSelected ? colors.primary : colors.textMuted}
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
            )}

            {/* Time Slot Selector */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
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
                          ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {slotLabel}
                      </Text>
                      <Text
                        className={`text-[11px] mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-umber dark:text-umber-dark'
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
                          ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark active:bg-card-selected'
                      }`}>
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {slotLabel}
                      </Text>
                      <Text
                        className={`text-[11px] mt-0.5 font-medium ${
                          isSelected ? 'text-white/85' : 'text-umber dark:text-umber-dark'
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
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Exact Reminder Time
              </Text>
              <Pressable
                onPress={() => setIsTimePickerOpen(true)}
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 flex-row items-center justify-between active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel={`Reminder time: ${reminderTime}. Tap to choose a different time.`}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                    {reminderTime || '8:00 AM'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-semibold text-umber dark:text-umber-dark">Change</Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
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
        </SafeAreaView>
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
