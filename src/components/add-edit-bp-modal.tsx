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
import { BloodPressureLog } from '@/types';
import { bloodPressureService } from '@/services/blood-pressure.service';
import { useAppStore } from '@/store/app.store';
import { formatTo12Hour, parseTo24Hour } from '@/utils/date.utils';
import { getBPCategory, getBPCategoryStyle } from '@/utils/bp.utils';
import { PrimaryButton } from './ui/primary-button';
import { ScrollableTimePickerModal } from './ui/scrollable-time-picker-modal';

interface AddEditBPModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLog?: BloodPressureLog | null;
}

export const AddEditBPModal: React.FC<AddEditBPModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialLog,
}) => {
  const triggerRefresh = useAppStore((state) => state.triggerRefresh);

  const isEditing = !!initialLog;

  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [arm, setArm] = useState<'left' | 'right'>('left');
  const [time12Hour, setTime12Hour] = useState('8:00 AM');
  const [notes, setNotes] = useState('');

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setError(null);
      if (initialLog) {
        setSystolic(initialLog.systolic.toString());
        setDiastolic(initialLog.diastolic.toString());
        setPulse(initialLog.pulse ? initialLog.pulse.toString() : '');
        setArm(initialLog.arm || 'left');
        setTime12Hour(formatTo12Hour(new Date(initialLog.loggedAt)));
        setNotes(initialLog.notes || '');
      } else {
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setArm('left');
        setTime12Hour(formatTo12Hour(new Date()));
        setNotes('');
      }
    }
  }, [visible, initialLog]);

  // Compute live category preview if numbers are entered
  const sysNum = parseInt(systolic, 10);
  const diaNum = parseInt(diastolic, 10);
  const hasValidNumbers = !isNaN(sysNum) && !isNaN(diaNum) && sysNum > 40 && diaNum > 30;
  const liveCategory = hasValidNumbers ? getBPCategory(sysNum, diaNum) : null;
  const categoryStyle = liveCategory ? getBPCategoryStyle(liveCategory) : null;

  const handleSave = async () => {
    if (!sysNum || !diaNum || sysNum < 50 || sysNum > 260 || diaNum < 30 || diaNum > 160) {
      setError('Please enter valid blood pressure numbers (e.g. 120 / 80).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Build ISO timestamp with selected time
      const datePart = initialLog
        ? initialLog.loggedAt.substring(0, 10)
        : new Date().toISOString().substring(0, 10);
      const canonicalTime = parseTo24Hour(time12Hour);
      const combinedIso = `${datePart}T${canonicalTime}:00.000Z`;

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
      onClose();
    } catch (e) {
      console.error('Error saving BP reading:', e);
      setError("Couldn't save reading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initialLog) return;

    Alert.alert(
      'Delete Blood Pressure Record',
      `Are you sure you want to delete this ${initialLog.systolic}/${initialLog.diastolic} mmHg reading?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await bloodPressureService.deleteLog(initialLog.id);
              triggerRefresh();
              onSuccess();
              onClose();
            } catch (e) {
              console.error('Error deleting BP log:', e);
              setError("Couldn't delete record. Please try again.");
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
                  {isEditing ? 'Edit Blood Pressure' : 'Log Blood Pressure'}
                </Text>
                <Text className="text-xs font-normal text-umber mt-0.5">
                  Record systolic, diastolic, and pulse.
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

            {/* Live Indicator Card */}
            {categoryStyle ? (
              <View
                className={`py-2 px-3 rounded-xl border flex-row items-center justify-between flex-wrap gap-1 ${categoryStyle.badgeBg} ${categoryStyle.badgeBorder}`}>
                <View className="flex-row items-center gap-1.5">
                  <MaterialCommunityIcons name="heart-pulse" size={17} color="#282522" />
                  <Text className="text-sm font-bold text-charcoal">
                    {categoryStyle.label}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-umber">
                  {categoryStyle.description}
                </Text>
              </View>
            ) : null}

            {/* Systolic & Diastolic Inputs */}
            <View className="flex-row gap-2.5">
              {/* Systolic */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal">
                    Systolic
                  </Text>
                  <Text className="text-[11px] font-medium text-umber">
                    Top
                  </Text>
                </View>
                <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border bg-surface px-2.5 min-h-[48px]">
                  <TextInput
                    className="flex-1 text-lg font-bold text-charcoal text-center"
                    placeholder="120"
                    placeholderTextColor="#8E867E"
                    keyboardType="number-pad"
                    value={systolic}
                    onChangeText={setSystolic}
                    maxLength={3}
                  />
                  <Text className="text-[10px] font-semibold text-umber">
                    mmHg
                  </Text>
                </View>
              </View>

              {/* Diastolic */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal">
                    Diastolic
                  </Text>
                  <Text className="text-[11px] font-medium text-umber">
                    Bottom
                  </Text>
                </View>
                <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border bg-surface px-2.5 min-h-[48px]">
                  <TextInput
                    className="flex-1 text-lg font-bold text-charcoal text-center"
                    placeholder="80"
                    placeholderTextColor="#8E867E"
                    keyboardType="number-pad"
                    value={diastolic}
                    onChangeText={setDiastolic}
                    maxLength={3}
                  />
                  <Text className="text-[10px] font-semibold text-umber">
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
                  <Text className="text-xs font-bold text-charcoal">
                    Pulse
                  </Text>
                  <Text className="text-[11px] font-medium text-umber">
                    Optional
                  </Text>
                </View>
                <View className="flex-row items-center rounded-xl border-[1.5px] border-subtle-border bg-surface px-2.5 min-h-[48px]">
                  <TextInput
                    className="flex-1 text-base font-bold text-charcoal text-center"
                    placeholder="72"
                    placeholderTextColor="#8E867E"
                    keyboardType="number-pad"
                    value={pulse}
                    onChangeText={setPulse}
                    maxLength={3}
                  />
                  <Text className="text-[10px] font-semibold text-umber">
                    bpm
                  </Text>
                </View>
              </View>

              {/* Arm Selector */}
              <View className="flex-1 gap-1">
                <View className="flex-row items-baseline justify-between px-0.5">
                  <Text className="text-xs font-bold text-charcoal">
                    Arm
                  </Text>
                  <Text className="text-[11px] font-medium text-umber">
                    Tested
                  </Text>
                </View>
                <View className="flex-row rounded-xl bg-surface p-1 border-[1.5px] border-subtle-border min-h-[48px] items-center">
                  <Pressable
                    onPress={() => setArm('left')}
                    className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                      arm === 'left' ? 'bg-sage' : 'bg-transparent'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        arm === 'left' ? 'text-white' : 'text-charcoal'
                      }`}>
                      Left
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setArm('right')}
                    className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                      arm === 'right' ? 'bg-sage' : 'bg-transparent'
                    }`}>
                    <Text
                      className={`text-xs font-bold ${
                        arm === 'right' ? 'text-white' : 'text-charcoal'
                      }`}>
                      Right
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Measurement Time */}
            <View className="gap-1">
              <Text className="text-xs font-bold text-charcoal px-0.5">
                Measurement Time
              </Text>
              <Pressable
                onPress={() => setIsTimePickerOpen(true)}
                className="min-h-[48px] rounded-xl border-[1.5px] border-subtle-border bg-surface px-3.5 flex-row items-center justify-between active:bg-card-selected"
                accessibilityRole="button"
                accessibilityLabel={`Reading time: ${time12Hour}. Tap to change.`}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="time-outline" size={18} color="#3D5A50" />
                  <Text className="text-base font-bold text-charcoal">
                    {time12Hour}
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
                placeholder="e.g. After waking up, felt relaxed"
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
                    : 'Save Blood Pressure'
                }
                variant="primary"
                disabled={isSubmitting}
                onPress={handleSave}
                className="min-h-[52px]"
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
        value={time12Hour}
        onConfirm={(newTime) => setTime12Hour(newTime)}
        onClose={() => setIsTimePickerOpen(false)}
      />
    </Modal>
  );
};

