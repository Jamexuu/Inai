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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BloodSugarLog, BloodSugarContext } from '@/types';
import { bloodSugarService } from '@/services/blood-sugar.service';
import { useAppStore } from '@/store/app.store';
import {
  formatTo12Hour,
  parseTo24Hour,
  formatDateToYMD,
  formatYMDToDisplay,
  getYesterdayYMD,
} from '@/utils/date.utils';
import { getSugarCategory, getSugarCategoryStyle, getSugarContextLabel } from '@/utils/sugar.utils';
import { PrimaryButton } from './ui/primary-button';
import { ScalePressable } from './ui/scale-pressable';
import { ScrollableTimePickerModal } from './ui/scrollable-time-picker-modal';
import { DatePickerModal } from './ui/date-picker-modal';
import { ConfirmationDialog } from './ui/confirmation-dialog';
import { useTheme } from '@/hooks/use-theme';

interface AddEditSugarModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLog?: BloodSugarLog | null;
  initialDate?: string; // Optional 'YYYY-MM-DD' for historical entry
}

const CONTEXT_OPTIONS: BloodSugarContext[] = [
  'fasting',
  'before_meal',
  'after_meal',
  'bedtime',
  'random',
];

export const AddEditSugarModal: React.FC<AddEditSugarModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialLog,
  initialDate,
}) => {
  const colors = useTheme();
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const isEditing = !!initialLog;

  const [level, setLevel] = useState('100');
  const [context, setContext] = useState<BloodSugarContext>('fasting');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || formatDateToYMD());
  const [time12Hour, setTime12Hour] = useState('8:00 AM');
  const [notes, setNotes] = useState('');

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      setError(null);
      setSuccessBanner(null);
      if (initialLog) {
        setLevel(initialLog.level.toString());
        setContext(initialLog.context);
        setSelectedDate(initialLog.loggedAt.substring(0, 10));
        setTime12Hour(formatTo12Hour(new Date(initialLog.loggedAt)));
        setNotes(initialLog.notes || '');
      } else {
        setLevel('');
        setContext('fasting');
        setSelectedDate(initialDate || formatDateToYMD());
        setTime12Hour(formatTo12Hour(new Date()));
        setNotes('');
      }
    }
  }, [visible, initialLog, initialDate]);

  // Live category calculation
  const numLevel = parseFloat(level);
  const hasValidNumber = !isNaN(numLevel) && numLevel > 30 && numLevel < 600;
  const liveCategory = hasValidNumber ? getSugarCategory(numLevel, context) : null;
  const categoryStyle = liveCategory ? getSugarCategoryStyle(liveCategory) : null;

  const todayYMD = formatDateToYMD();
  const yesterdayYMD = getYesterdayYMD();

  const handleSave = async (saveAndAddAnother = false) => {
    if (!hasValidNumber) {
      setError('Please enter a valid blood sugar reading (e.g. 100 mg/dL).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessBanner(null);

    try {
      const canonicalTime = parseTo24Hour(time12Hour);
      const combinedIso = `${selectedDate}T${canonicalTime}:00.000Z`;

      if (isEditing && initialLog) {
        await bloodSugarService.updateLog({
          ...initialLog,
          level: Math.round(numLevel),
          context,
          loggedAt: combinedIso,
          notes: notes.trim() || undefined,
        });
      } else {
        await bloodSugarService.addLog({
          level: Math.round(numLevel),
          context,
          loggedAt: combinedIso,
          notes: notes.trim() || undefined,
        });
      }

      triggerRefresh();
      onSuccess();

      if (saveAndAddAnother && !isEditing) {
        setSuccessBanner(`✓ Saved ${Math.round(numLevel)} mg/dL for ${formatYMDToDisplay(selectedDate)}! You can log another reading.`);
        setLevel('');
        setNotes('');
        setIsSubmitting(false);
      } else {
        onClose();
      }
    } catch (e) {
      console.error('Error saving blood sugar log:', e);
      setError("Couldn't save reading. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialLog) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!initialLog) return;
    setIsSubmitting(true);
    try {
      await bloodSugarService.deleteLog(initialLog.id);
      triggerRefresh();
      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting blood sugar record:', e);
      setError("Couldn't delete record. Please try again.");
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/60 justify-end">
        <SafeAreaView
          edges={['bottom']}
          style={{ backgroundColor: colors.backgroundCard }}
          className="rounded-t-3xl border-t-[1.5px] border-x-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark max-h-[92%]">
          <ScrollView
            contentContainerClassName="px-4 py-4 pb-12 gap-3"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row justify-between items-start mb-0.5">
              <View className="flex-1 pr-2">
                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  {isEditing ? 'Edit Blood Sugar' : 'Log Blood Sugar'}
                </Text>
                <Text className="text-sm font-medium text-umber dark:text-umber-dark mt-0.5">
                  Record glucose level and measurement context.
                </Text>
              </View>
              <ScalePressable
                onPress={onClose}
                scaleTo={0.9}
                className="min-w-[44px] min-h-[44px] items-center justify-center -mr-1.5 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Close modal">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </ScalePressable>
            </View>

            {/* Success Banner for Historical Batch Logging */}
            {successBanner ? (
              <View className="p-3 rounded-xl border border-herbal dark:border-herbal-dark bg-herbal-tint dark:bg-herbal-dark-tint flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text className="text-xs font-bold text-herbal dark:text-herbal-dark flex-1">
                  {successBanner}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View className="p-2.5 rounded-xl border border-brick dark:border-brick-dark bg-brick-tint dark:bg-brick-dark-tint">
                <Text className="text-xs font-semibold text-brick dark:text-brick-dark">{error}</Text>
              </View>
            ) : null}

            {/* Date Selector Row (Historical tracking support) */}
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between px-0.5">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                  Reading Date
                </Text>
                <Text className="text-[11px] font-semibold text-umber dark:text-umber-dark">
                  {selectedDate === todayYMD ? 'Today' : formatYMDToDisplay(selectedDate)}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <ScalePressable
                  onPress={() => setSelectedDate(todayYMD)}
                  scaleTo={0.92}
                  className={`flex-1 min-h-[42px] rounded-xl border flex-row items-center justify-center active:opacity-85 ${
                    selectedDate === todayYMD
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      selectedDate === todayYMD ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    Today
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => setSelectedDate(yesterdayYMD)}
                  scaleTo={0.92}
                  className={`flex-1 min-h-[42px] rounded-xl border flex-row items-center justify-center active:opacity-85 ${
                    selectedDate === yesterdayYMD
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      selectedDate === yesterdayYMD ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    Yesterday
                  </Text>
                </ScalePressable>

                <ScalePressable
                  onPress={() => setIsDatePickerOpen(true)}
                  scaleTo={0.92}
                  className={`flex-1 min-h-[42px] rounded-xl border flex-row items-center justify-center gap-1 px-2 active:opacity-85 ${
                    selectedDate !== todayYMD && selectedDate !== yesterdayYMD
                      ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                      : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                  }`}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={
                      selectedDate !== todayYMD && selectedDate !== yesterdayYMD
                        ? '#FFFFFF'
                        : colors.primary
                    }
                  />
                  <Text
                    numberOfLines={1}
                    className={`text-xs font-bold ${
                      selectedDate !== todayYMD && selectedDate !== yesterdayYMD
                        ? 'text-white'
                        : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    {selectedDate !== todayYMD && selectedDate !== yesterdayYMD
                      ? formatYMDToDisplay(selectedDate)
                      : 'Past Date'}
                  </Text>
                </ScalePressable>
              </View>
            </View>

            {/* Live Indicator Card */}
            {categoryStyle ? (
              <View
                className={`py-2 px-3 rounded-xl border flex-row items-center justify-between flex-wrap gap-1 ${categoryStyle.badgeBg} ${categoryStyle.badgeBorder}`}>
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="water" size={17} color={colors.text} />
                  <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
                    {categoryStyle.label}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                  {categoryStyle.description}
                </Text>
              </View>
            ) : null}

            {/* Glucose Reading Input */}
            <View className="gap-1">
              <View className="flex-row items-baseline justify-between px-0.5">
                <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                  Glucose Reading
                </Text>
                <Text className="text-[11px] font-medium text-umber dark:text-umber-dark">
                  Target: 70 - 140 mg/dL
                </Text>
              </View>
              <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3 min-h-[50px]">
                <TextInput
                  className="flex-1 text-2xl font-bold text-charcoal dark:text-charcoal-dark text-center"
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={level}
                  onChangeText={setLevel}
                  maxLength={3}
                />
                <Text className="text-sm font-bold text-umber dark:text-umber-dark">mg/dL</Text>
              </View>
            </View>

            {/* Measurement Context Chips */}
            <View className="gap-1.5">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Measurement Context
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {CONTEXT_OPTIONS.map((ctx) => {
                  const isSelected = context === ctx;
                  return (
                    <ScalePressable
                      key={ctx}
                      onPress={() => setContext(ctx)}
                      scaleTo={0.92}
                      accessibilityRole="button"
                      accessibilityLabel={`Select context ${getSugarContextLabel(ctx)}`}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl border flex-row items-center justify-center ${
                        isSelected
                          ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                          : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                      }`}>
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                        }`}>
                        {getSugarContextLabel(ctx)}
                      </Text>
                    </ScalePressable>
                  );
                })}
              </View>
            </View>

            {/* Measurement Time */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Measurement Time
              </Text>
              <ScalePressable
                onPress={() => setIsTimePickerOpen(true)}
                scaleTo={0.97}
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3.5 flex-row items-center justify-between active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel={`Reading time: ${time12Hour}. Tap to change.`}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                    {time12Hour}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-semibold text-umber dark:text-umber-dark">Change</Text>
                  <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
                </View>
              </ScalePressable>
            </View>

            {/* Notes */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark px-0.5">
                Notes (Optional)
              </Text>
              <TextInput
                className="min-h-[46px] rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-3 text-sm text-charcoal dark:text-charcoal-dark font-medium"
                placeholder="e.g. 2 hours after lunch, felt energetic"
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
                    : 'Save Blood Sugar'
                }
                variant="primary"
                disabled={isSubmitting}
                onPress={() => handleSave(false)}
                className="min-h-[52px]"
              />

              {!isEditing ? (
                <PrimaryButton
                  label="Save & Log Another"
                  icon={<Ionicons name="add-sharp" size={18} color={colors.primary} />}
                  variant="outline"
                  disabled={isSubmitting}
                  onPress={() => handleSave(true)}
                  className="min-h-[48px]"
                />
              ) : null}

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

      {/* Date Picker Modal for Past Logs */}
      <DatePickerModal
        visible={isDatePickerOpen}
        value={selectedDate}
        title="Select Blood Sugar Date"
        onConfirm={(newDate) => setSelectedDate(newDate)}
        onClose={() => setIsDatePickerOpen(false)}
      />

      {/* Scrollable Time Picker Modal */}
      <ScrollableTimePickerModal
        visible={isTimePickerOpen}
        value={time12Hour}
        onConfirm={(newTime) => setTime12Hour(newTime)}
        onClose={() => setIsTimePickerOpen(false)}
      />

      {/* Simple Confirmation Modal for Deleting Sugar Reading */}
      <ConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete reading?"
        message={`Delete this ${initialLog?.level} mg/dL reading?`}
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
