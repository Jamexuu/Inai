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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Meal, MealType } from '@/types';
import { mealService } from '@/services/meal.service';
import { useAppStore } from '@/store/app.store';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { PrimaryButton } from './ui/primary-button';
import { ScrollableTimePickerModal } from './ui/scrollable-time-picker-modal';
import { useTheme } from '@/hooks/use-theme';

interface AddEditMealModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialMeal?: Meal | null;
}

interface MealTypeConfig {
  type: MealType;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  defaultTime: string;
}

const MEAL_TYPES: MealTypeConfig[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'coffee-outline', defaultTime: '7:30 AM' },
  { type: 'lunch', label: 'Lunch', icon: 'food-apple-outline', defaultTime: '12:30 PM' },
  { type: 'dinner', label: 'Dinner', icon: 'silverware-fork-knife', defaultTime: '6:30 PM' },
  { type: 'snack', label: 'Snack', icon: 'cookie-outline', defaultTime: '3:30 PM' },
];

export const AddEditMealModal: React.FC<AddEditMealModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialMeal,
}) => {
  const colors = useTheme();
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const isEditing = !!initialMeal;

  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [label, setLabel] = useState('');
  const [targetTime, setTargetTime] = useState('7:30 AM');
  const [notes, setNotes] = useState('');
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setError(null);
      if (initialMeal) {
        setMealType(initialMeal.mealType);
        setLabel(initialMeal.label);
        setTargetTime(formatTo12Hour(initialMeal.targetTime));
        setNotes(initialMeal.notes || '');
      } else {
        setMealType('breakfast');
        setLabel('Breakfast');
        setTargetTime('7:30 AM');
        setNotes('');
      }
    }
  }, [visible, initialMeal]);

  const handleMealTypeSelect = (type: MealType, defaultLabel: string, defaultTime: string) => {
    setMealType(type);
    if (!isEditing || !label.trim()) {
      setLabel(defaultLabel);
      setTargetTime(defaultTime);
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      setError('Please provide a meal name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const canonicalTime = parseTo24Hour(targetTime);

      if (isEditing && initialMeal) {
        await mealService.updateMeal({
          ...initialMeal,
          mealType,
          label: label.trim(),
          targetTime: canonicalTime,
          notes: notes.trim() || undefined,
        });
      } else {
        await mealService.addMeal({
          mealType,
          label: label.trim(),
          targetTime: canonicalTime,
          notes: notes.trim() || undefined,
        });
      }

      triggerRefresh();
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error saving meal:', e);
      setError("Couldn't save meal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialMeal) return;

    Alert.alert(
      'Delete Meal',
      `Are you sure you want to remove "${initialMeal.label}" from your daily schedule?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await mealService.deleteMeal(initialMeal.id);
              triggerRefresh();
              onSuccess();
              onClose();
            } catch (e) {
              console.error('Error deleting meal:', e);
              setError("Couldn't delete meal. Please try again.");
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                  {isEditing ? 'Edit Meal' : 'Add New Meal'}
                </Text>
                <Text className="text-sm font-medium text-umber dark:text-umber-dark mt-0.5">
                  {isEditing
                    ? 'Update routine, meal name, or notes.'
                    : 'Schedule a calm, daily meal routine.'}
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

            {error ? (
              <View className="p-2.5 rounded-xl border border-brick dark:border-brick-dark bg-brick-tint dark:bg-brick-dark-tint">
                <Text className="text-xs font-semibold text-brick dark:text-brick-dark">{error}</Text>
              </View>
            ) : null}

            {/* Meal Type Quick Selector */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Meal Category
              </Text>
              <View className="flex-row gap-2">
                {MEAL_TYPES.map((cfg) => {
                  const isSelected = mealType === cfg.type;
                  return (
                    <Pressable
                      key={cfg.type}
                      onPress={() => handleMealTypeSelect(cfg.type, cfg.label, cfg.defaultTime)}
                      className={`flex-1 py-2 rounded-xl border-[1.5px] items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                      }`}>
                      <MaterialCommunityIcons
                        name={cfg.icon}
                        size={20}
                        color={isSelected ? '#FFFFFF' : colors.primary}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {cfg.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Label Input */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Meal Description / Label
              </Text>
              <TextInput
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 text-base text-charcoal dark:text-charcoal-dark font-medium"
                placeholder="e.g. Oatmeal with fruit"
                placeholderTextColor={colors.textMuted}
                value={label}
                onChangeText={setLabel}
              />
            </View>

            {/* Target Time */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Target Time
              </Text>
              <Pressable
                onPress={() => setIsTimePickerOpen(true)}
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 flex-row items-center justify-between active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel={`Meal time: ${targetTime}. Tap to change.`}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                    {targetTime}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-semibold text-umber dark:text-umber-dark">Change</Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                </View>
              </Pressable>
            </View>

            {/* Notes */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Notes (Optional)
              </Text>
              <TextInput
                className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3 text-sm text-charcoal dark:text-charcoal-dark font-medium"
                placeholder="e.g. Low sodium, take medicine after"
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Actions */}
            <View className="gap-2 mt-1">
              <PrimaryButton
                label={
                  isSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Save Changes'
                    : 'Save Meal Routine'
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
                    variant="danger"
                    icon={<Ionicons name="trash-outline" size={16} color="#B84233" />}
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
        value={targetTime}
        onConfirm={(newTime) => setTargetTime(newTime)}
        onClose={() => setIsTimePickerOpen(false)}
      />
    </Modal>
  );
};
