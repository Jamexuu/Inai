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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BloodPressureLog } from '@/types';
import { bloodPressureService } from '@/services/blood-pressure.service';
import { useAppStore } from '@/store/app.store';
import {
  formatTo12Hour,
  parseTo24Hour,
  formatDateToYMD,
  formatYMDToDisplay,
  getYesterdayYMD,
} from '@/utils/date.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';
import { PrimaryButton } from './ui/primary-button';
import { ScalePressable } from './ui/scale-pressable';
import { ScrollableTimePickerModal } from './ui/scrollable-time-picker-modal';
import { DatePickerModal } from './ui/date-picker-modal';
import { ConfirmationDialog } from './ui/confirmation-dialog';
import { useTheme } from '@/hooks/use-theme';

interface AddEditBPModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLog?: BloodPressureLog | null;
  initialDate?: string; // Optional 'YYYY-MM-DD' for historical entry
}

export const AddEditBPModal: React.FC<AddEditBPModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialLog,
  initialDate,
}) => {
  const colors = useTheme();
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const isEditing = !!initialLog;

  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [arm, setArm] = useState<'left' | 'right'>('left');
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
        setSystolic(initialLog.systolic.toString());
        setDiastolic(initialLog.diastolic.toString());
        setPulse(initialLog.pulse ? initialLog.pulse.toString() : '');
        setArm(initialLog.arm || 'left');
        setSelectedDate(initialLog.loggedAt.substring(0, 10));
        setTime12Hour(formatTo12Hour(new Date(initialLog.loggedAt)));
        setNotes(initialLog.notes || '');
      } else {
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setArm('left');
        setSelectedDate(initialDate || formatDateToYMD());
        setTime12Hour(formatTo12Hour(new Date()));
        setNotes('');
      }
    }
  }, [visible, initialLog, initialDate]);

  // Compute live category preview if numbers are entered
  const sysNum = parseInt(systolic, 10);
  const diaNum = parseInt(diastolic, 10);
  const hasValidNumbers = !isNaN(sysNum) && !isNaN(diaNum) && sysNum > 40 && diaNum > 30;
  const liveCategory = hasValidNumbers ? getBPCategory(sysNum, diaNum) : null;
  const categoryStyle = liveCategory ? getBPCategoryStyle(liveCategory) : null;

  const todayYMD = formatDateToYMD();
  const yesterdayYMD = getYesterdayYMD();

  const handleSave = async (saveAndAddAnother = false) => {
    if (!sysNum || !diaNum || sysNum < 50 || sysNum > 260 || diaNum < 30 || diaNum > 160) {
      setError('Please enter valid blood pressure numbers (e.g. 120 / 80).');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessBanner(null);

    try {
      const canonicalTime = parseTo24Hour(time12Hour);
      const combinedIso = `${selectedDate}T${canonicalTime}:00.000Z`;

      const pulseNum = parseInt(pulse, 10);

      if (isEditing && initialLog) {
        await bloodPressureService.updateLog({
          ...initialLog,
          systolic: sysNum,
          diastolic: diaNum,
          pulse: !isNaN(pulseNum) ? pulseNum : undefined,
          loggedAt: combinedIso,
          notes: notes.trim() || undefined,
          arm,
        });
      } else {
        await bloodPressureService.addLog({
          systolic: sysNum,
          diastolic: diaNum,
          pulse: !isNaN(pulseNum) ? pulseNum : undefined,
          loggedAt: combinedIso,
          notes: notes.trim() || undefined,
          arm,
        });
      }

      triggerRefresh();
      onSuccess();

      if (saveAndAddAnother && !isEditing) {
        setSuccessBanner(`✓ Saved ${sysNum}/${diaNum} mmHg for ${formatYMDToDisplay(selectedDate)}! You can log another reading.`);
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setNotes('');
        setIsSubmitting(false);
      } else {
        onClose();
      }
    } catch (e) {
      console.error('Error saving BP reading:', e);
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
      await bloodPressureService.deleteLog(initialLog.id);
      triggerRefresh();
      setShowDeleteConfirm(false);
      onSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting BP log:', e);
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
            contentContainerClassName="px-3.5 py-4 pb-12 gap-3"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="flex-row justify-between items-start mb-0.5">
              <View className="flex-1 pr-2">
                <Text className="text-xl font-bold text-charcoal dark:text-charcoal-dark">
                  {isEditing ? 'Edit Blood Pressure' : 'Log Blood Pressure'}
                </Text>
                <Text className="text-sm font-medium text-umber dark:text-umber-dark mt-0.5">
                  Record systolic, diastolic, and pulse readings.
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
                  <MaterialCommunityIcons name="heart-pulse" size={17} color={colors.text} />
                  <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
                    {categoryStyle.label}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                  {categoryStyle.description}
                </Text>
              </View>
            ) : null}

            {/* Systolic & Diastolic Inputs */}
            <View className="flex-row gap-2.5">
              {/* Systolic */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                    Systolic
                  </Text>
                  <Text className="text-[11px] font-medium text-umber dark:text-umber-dark">
                    Top
                  </Text>
                </View>
                <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-2.5 min-h-[48px]">
                  <TextInput
                    className="flex-1 text-lg font-bold text-charcoal dark:text-charcoal-dark text-center"
                    placeholder="120"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={systolic}
                    onChangeText={setSystolic}
                    maxLength={3}
                  />
                  <Text className="text-[10px] font-semibold text-umber dark:text-umber-dark">
                    mmHg
                  </Text>
                </View>
              </View>

              {/* Diastolic */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                    Diastolic
                  </Text>
                  <Text className="text-[11px] font-medium text-umber dark:text-umber-dark">
                    Bottom
                  </Text>
                </View>
                <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-2.5 min-h-[48px]">
                  <TextInput
                    className="flex-1 text-lg font-bold text-charcoal dark:text-charcoal-dark text-center"
                    placeholder="80"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={diastolic}
                    onChangeText={setDiastolic}
                    maxLength={3}
                  />
                  <Text className="text-[10px] font-semibold text-umber dark:text-umber-dark">
                    mmHg
                  </Text>
                </View>
              </View>
            </View>

            {/* Pulse & Arm Row */}
            <View className="flex-row gap-2.5">
              {/* Pulse */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                    Pulse
                  </Text>
                  <Text className="text-[11px] font-medium text-umber dark:text-umber-dark">
                    Optional
                  </Text>
                </View>
                <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark px-2.5 min-h-[48px]">
                  <TextInput
                    className="flex-1 text-base font-bold text-charcoal dark:text-charcoal-dark text-center"
                    placeholder="72"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    value={pulse}
                    onChangeText={setPulse}
                    maxLength={3}
                  />
                  <Text className="text-[10px] font-semibold text-umber dark:text-umber-dark">
                    bpm
                  </Text>
                </View>
              </View>

              {/* Arm Selector */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal dark:text-charcoal-dark">
                    Arm
                  </Text>
                  <Text className="text-[11px] font-medium text-umber dark:text-umber-dark">
                    Tested
                  </Text>
                </View>
                <View className="flex-row rounded-xl bg-surface dark:bg-surface-dark p-1 border-[1.5px] border-subtle-border dark:border-subtle-border-dark min-h-[48px] items-center">
                  <ScalePressable
                    onPress={() => setArm('left')}
                    scaleTo={0.93}
                    className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                      arm === 'left' ? 'bg-sage dark:bg-sage-dark' : 'bg-transparent'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        arm === 'left' ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                      }`}>
                      Left
                    </Text>
                  </ScalePressable>
                  <ScalePressable
                    onPress={() => setArm('right')}
                    scaleTo={0.93}
                    className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                      arm === 'right' ? 'bg-sage dark:bg-sage-dark' : 'bg-transparent'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        arm === 'right' ? 'text-white' : 'text-charcoal dark:text-charcoal-dark'
                      }`}>
                      Right
                    </Text>
                  </ScalePressable>
                </View>
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
                placeholder="e.g. After waking up, felt relaxed"
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
                    : 'Save Blood Pressure'
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
        title="Select Blood Pressure Date"
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

      {/* Simple Confirmation Modal for Deleting Reading */}
      <ConfirmationDialog
        visible={showDeleteConfirm}
        title="Delete reading?"
        message={`Delete this ${initialLog?.systolic}/${initialLog?.diastolic} mmHg reading?`}
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
