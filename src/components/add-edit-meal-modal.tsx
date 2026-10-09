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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Meal, MealType } from '@/types';
import { mealService } from '@/services/meal.service';
import { useAppStore } from '@/store/app.store';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { PrimaryButton } from './ui/primary-button';
import { ScrollableTimePickerModal } from './ui/scrollable-time-picker-modal';

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
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                  {isEditing ? 'Edit Meal' : 'Add New Meal'}
                </Text>
                <Text className="text-xs font-normal text-umber mt-0.5">
                  {isEditing
                    ? 'Update routine, meal name, or notes.'
                    : 'Schedule a calm, daily meal routine.'}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="p-1.5 -mr-1.5 active:opacity-70"
                accessibilityLabel="Close modal">
                <Ionicons name="close" size={24} color="#6B645D" />
              </Pressable>
            </View>

            {error ? (
              <View className="p-2.5 rounded-xl border border-brick bg-brick-tint">
                <Text className="text-xs font-semibold text-brick">{error}</Text>
              </View>
            ) : null}

            {/* Meal Category Selector */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Meal Category
              </Text>
              <View className="gap-1.5">
                {/* Row 1: Breakfast & Lunch */}
                <View className="flex-row gap-2">
                  {MEAL_TYPES.slice(0, 2).map((t) => {
                    const isSelected = mealType === t.type;
                    return (
                      <Pressable
                        key={t.type}
                        onPress={() => handleMealTypeSelect(t.type, t.label, t.defaultTime)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-[1.5px] flex-row items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-sage border-sage'
                            : 'bg-surface border-subtle-border active:bg-card-selected'
                        }`}>
                        <MaterialCommunityIcons
                          name={t.icon}
                          size={18}
                          color={isSelected ? '#FFFFFF' : '#3D5A50'}
                        />
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? 'text-white' : 'text-charcoal'
                          }`}>
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Row 2: Dinner & Snack */}
                <View className="flex-row gap-2">
                  {MEAL_TYPES.slice(2, 4).map((t) => {
                    const isSelected = mealType === t.type;
                    return (
                      <Pressable
                        key={t.type}
                        onPress={() => handleMealTypeSelect(t.type, t.label, t.defaultTime)}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-[1.5px] flex-row items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-sage border-sage'
                            : 'bg-surface border-subtle-border active:bg-card-selected'
                        }`}>
                        <MaterialCommunityIcons
                          name={t.icon}
                          size={18}
                          color={isSelected ? '#FFFFFF' : '#3D5A50'}
                        />
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? 'text-white' : 'text-charcoal'
                          }`}>
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Meal Label Input */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Meal Name
              </Text>
              <TextInput
                className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 text-base text-charcoal font-medium"
                placeholder="e.g. Breakfast, Morning Snack"
                placeholderTextColor="#8E867E"
                value={label}
                onChangeText={setLabel}
              />
            </View>

            {/* Target Time Picker */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Usual Meal Time
              </Text>
              <Pressable
                onPress={() => setIsTimePickerOpen(true)}
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 flex-row items-center justify-between active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel={`Usual meal time: ${targetTime}. Tap to choose a different time.`}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color="#3D5A50" />
                  <Text className="text-base font-bold text-charcoal">
                    {targetTime}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-semibold text-umber">Change</Text>
                  <Ionicons name="chevron-forward" size={15} color="#8E867E" />
                </View>
              </Pressable>
            </View>

            {/* Notes */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Notes (Optional)
              </Text>
              <TextInput
                className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3 text-sm text-charcoal font-medium"
                placeholder="e.g. Low salt, Take vitamins after"
                placeholderTextColor="#8E867E"
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
                    : 'Add Meal'
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
        </View>
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

