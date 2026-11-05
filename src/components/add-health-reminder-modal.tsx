import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, ScalePressable, ScrollableTimePickerModal } from '@/components/ui';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { useTheme } from '@/hooks/use-theme';

interface AddHealthReminderModalProps {
  visible: boolean;
  type: 'bp' | 'sugar';
  initialReminder?: { id: string; label: string; reminderTime: string } | null;
  onClose: () => void;
  onSave: (label: string, reminderTime: string, id?: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

const BP_PRESETS = [
  'Morning Check',
  'Afternoon Check',
  'Evening Check',
  'Bedtime Check',
];

const SUGAR_PRESETS = [
  'Morning Fasting',
  'Before Lunch',
  'After Lunch',
  'Before Dinner',
  'After Dinner',
  'Bedtime Check',
];

export const AddHealthReminderModal: React.FC<AddHealthReminderModalProps> = ({
  visible,
  type,
  initialReminder,
  onClose,
  onSave,
  onDelete,
}) => {
  const colors = useTheme();
  const presets = type === 'bp' ? BP_PRESETS : SUGAR_PRESETS;

  const [label, setLabel] = useState('');
  const [time, setTime] = useState('08:00');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialReminder) {
        setLabel(initialReminder.label);
        setTime(initialReminder.reminderTime || '08:00');
      } else {
        setLabel(presets[0]);
        setTime(type === 'bp' ? '08:00' : '07:30');
      }
      setError(null);
    }
  }, [visible, initialReminder, type]);

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Please provide a title or purpose for this reminder.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(trimmed, parseTo24Hour(time), initialReminder?.id);
      onClose();
    } catch {
      setError("Couldn't save reminder. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialReminder || !onDelete) return;
    setIsSubmitting(true);
    try {
      await onDelete(initialReminder.id);
      onClose();
    } catch {
      setError("Couldn't delete reminder.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialReminder);
  const formattedTime = formatTo12Hour(time);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      accessibilityViewIsModal={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/65 justify-end">
        <Pressable
          className="flex-1"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal backdrop"
        />

        <View className="bg-card dark:bg-card-dark rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border dark:border-subtle-border-dark p-6 pb-9 gap-5 shadow-2xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className={`w-11 h-11 rounded-2xl items-center justify-center border ${
                  type === 'bp'
                    ? 'bg-sage-tint dark:bg-sage-dark-tint border-sage/30'
                    : 'bg-terracotta-tint dark:bg-terracotta-dark-tint border-terracotta/30'
                }`}>
                <Ionicons
                  name={type === 'bp' ? 'heart' : 'water'}
                  size={22}
                  color={type === 'bp' ? colors.primary : colors.secondary}
                />
              </View>
              <View>
                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  {isEditing
                    ? `Modify ${type === 'bp' ? 'BP' : 'Sugar'} Reminder`
                    : `Add ${type === 'bp' ? 'Blood Pressure' : 'Blood Sugar'} Reminder`}
                </Text>
                <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                  Gentle daily offline notification
                </Text>
              </View>
            </View>

            <ScalePressable
              onPress={onClose}
              scaleTo={0.9}
              className="w-10 h-10 rounded-full items-center justify-center bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark"
              accessibilityRole="button"
              accessibilityLabel="Close reminder dialog">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </ScalePressable>
          </View>

          {/* Quick Preset Chips */}
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-umber dark:text-umber-dark">
              Quick Presets
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="flex-row items-center gap-2">
              {presets.map((preset) => {
                const isSelected = label.trim().toLowerCase() === preset.toLowerCase();
                return (
                  <ScalePressable
                    key={preset}
                    onPress={() => {
                      setLabel(preset);
                      if (error) setError(null);
                    }}
                    scaleTo={0.94}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full border items-center justify-center ${
                      isSelected
                        ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                        : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                    }`}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${preset}`}>
                    <Text
                      className={`text-sm font-bold ${
                        isSelected
                          ? 'text-white'
                          : 'text-charcoal dark:text-charcoal-dark'
                      }`}>
                      {preset}
                    </Text>
                  </ScalePressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Title / Label Input */}
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-umber dark:text-umber-dark">
              Reminder Title / Label
            </Text>
            <TextInput
              className="min-h-[50px] rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 text-base text-charcoal dark:text-charcoal-dark font-medium"
              placeholder="e.g. Afternoon Check"
              placeholderTextColor={colors.textMuted}
              value={label}
              onChangeText={(text) => {
                setLabel(text);
                if (error) setError(null);
              }}
              accessibilityLabel="Enter reminder title"
            />
            {error && (
              <Text className="text-xs font-semibold text-terracotta dark:text-terracotta-dark">
                {error}
              </Text>
            )}
          </View>

          {/* Time Selector */}
          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-wider text-umber dark:text-umber-dark">
              Reminder Time
            </Text>
            <ScalePressable
              onPress={() => setIsTimePickerOpen(true)}
              scaleTo={0.96}
              className="min-h-[54px] rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-4 flex-row items-center justify-between"
              accessibilityRole="button"
              accessibilityLabel={`Select reminder time, currently ${formattedTime}`}>
              <View className="flex-row items-center gap-2.5">
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                  {formattedTime}
                </Text>
              </View>
              <Text className="text-xs font-bold text-sage dark:text-sage-dark underline">
                Change Time
              </Text>
            </ScalePressable>
          </View>

          {/* Actions */}
          <View className="flex-row items-center gap-3 pt-2">
            {isEditing && onDelete ? (
              <PrimaryButton
                label="Delete"
                variant="outline"
                icon={<Ionicons name="trash-outline" size={18} color={colors.secondary} />}
                onPress={handleDelete}
                disabled={isSubmitting}
                className="flex-1 min-h-[50px]"
              />
            ) : null}
            <PrimaryButton
              label={isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Reminder'}
              variant="primary"
              onPress={handleSubmit}
              disabled={isSubmitting || !label.trim()}
              className="flex-1 min-h-[50px]"
            />
          </View>
        </View>

        {/* Scrollable Time Picker Modal */}
        <ScrollableTimePickerModal
          visible={isTimePickerOpen}
          value={time}
          onConfirm={(new12Hour) => {
            setTime(parseTo24Hour(new12Hour));
            setIsTimePickerOpen(false);
          }}
          onClose={() => setIsTimePickerOpen(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

