import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodayMedicineDose } from '@/types';
import { formatTo12Hour } from '@/utils/date.utils';
import { StatusBadge } from './status-badge';
import { PrimaryButton } from './primary-button';

interface MedicineCardProps {
  dose: TodayMedicineDose;
  onMarkTaken: (dose: TodayMedicineDose) => void;
  onMarkSkipped: (dose: TodayMedicineDose) => void;
  onPressCard?: (dose: TodayMedicineDose) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  dose,
  onMarkTaken,
  onMarkSkipped,
}) => {
  const isPending = dose.status === 'pending';
  const isTaken = dose.status === 'taken';

  return (
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 mb-3 shadow-sm">
      {/* Header with Time and Status */}
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="time-outline" size={18} color="#3D5A50" />
          <Text className="text-lg font-bold text-sage">
            {formatTo12Hour(dose.reminderTime)}
          </Text>
          <Text className="text-sm font-medium text-umber">
            ({dose.timeSlot.charAt(0).toUpperCase() + dose.timeSlot.slice(1)})
          </Text>
        </View>
        <StatusBadge status={dose.status} />
      </View>

      {/* Medicine Info */}
      <View className="mb-3 gap-1">
        <Text className="text-[22px] font-bold tracking-wide text-charcoal">
          {dose.medicineName}
        </Text>
        <Text className="text-[17px] font-semibold text-terracotta">
          {dose.dosage}
        </Text>
        {dose.instructions ? (
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Ionicons name="information-circle-outline" size={16} color="#6B645D" />
            <Text className="text-[15px] font-medium text-umber flex-1">
              {dose.instructions}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      {isPending ? (
        <View className="flex-row gap-2.5 mt-1">
          <PrimaryButton
            label="Take Dose"
            icon={<Ionicons name="checkmark" size={20} color="#FFFFFF" />}
            variant="primary"
            onPress={() => onMarkTaken(dose)}
            className="flex-[2]"
          />
          <PrimaryButton
            label="Skip"
            icon={<Ionicons name="close" size={18} color="#3D5A50" />}
            variant="outline"
            onPress={() => onMarkSkipped(dose)}
            className="flex-1"
          />
        </View>
      ) : (
        <View className="flex-row items-center justify-between pt-2 border-t border-subtle-border">
          <View className="flex-row items-center gap-1.5 flex-1">
            <Ionicons
              name={isTaken ? 'checkmark-circle' : 'close-circle-outline'}
              size={18}
              color={isTaken ? '#2E684D' : '#6B645D'}
            />
            <Text className="text-[15px] font-medium text-umber">
              {isTaken
                ? `Completed for today${dose.loggedAt ? ` (${formatTo12Hour(dose.loggedAt)})` : ''}`
                : 'Skipped for today'}
            </Text>
          </View>
          <PrimaryButton
            label="Change"
            variant="ghost"
            onPress={() => (isTaken ? onMarkSkipped(dose) : onMarkTaken(dose))}
            className="min-h-[40px] px-3"
          />
        </View>
      )}
    </View>
  );
};
