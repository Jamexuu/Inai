import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TodayMedicineDose } from '@/types';
import { MedicineRoutineSlotGroup } from '@/utils/medicine-group.utils';
import { useTheme } from '@/hooks/use-theme';
import { PrimaryButton } from './primary-button';
import { formatTo12Hour } from '@/utils/date.utils';

interface MedicineGroupCardProps {
  group: MedicineRoutineSlotGroup;
  selectedDateYMD?: string;
  isToday?: boolean;
  onTakeAll: (doses: TodayMedicineDose[]) => void;
  onSkipAll: (doses: TodayMedicineDose[]) => void;
  onToggleDose: (dose: TodayMedicineDose) => void;
}

export const MedicineGroupCard: React.FC<MedicineGroupCardProps> = ({
  group,
  onTakeAll,
  onSkipAll,
  onToggleDose,
}) => {
  const colors = useTheme();

  const isAllTaken = group.allTaken;
  const isAllSkipped = group.allSkipped;
  const hasSomeTaken = group.someTaken;
  const pendingDoses = group.doses.filter((d) => d.status === 'pending');
  const hasPending = pendingDoses.length > 0;

  const cardBorderClass = isAllTaken
    ? 'border-herbal/40 dark:border-herbal-dark/40 bg-herbal-tint/20 dark:bg-herbal-dark-tint/20'
    : isAllSkipped
    ? 'border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark opacity-80'
    : 'border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark';

  return (
    <View
      className={`rounded-2xl border-[1.5px] p-4 mb-3.5 gap-3 ${cardBorderClass}`}>
      {/* Header Row: Slot Info & Status Badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1 pr-2">
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center border border-subtle-border dark:border-subtle-border-dark ${group.iconBg}`}>
            <Ionicons name={group.iconName} size={20} color={group.iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-charcoal dark:text-charcoal-dark leading-tight">
              {group.slotTitle}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text className="text-sm font-semibold text-sage dark:text-sage-dark">
                {group.formattedTime}
              </Text>
              <Text className="text-xs font-medium text-umber dark:text-umber-dark">
                • {group.slotSubtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Slot Level Badge */}
        {isAllTaken ? (
          <View className="px-3 py-1.5 rounded-xl bg-herbal-tint dark:bg-herbal-dark-tint border border-herbal/40 dark:border-herbal-dark/40 flex-row items-center gap-1">
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text className="text-xs font-bold text-herbal dark:text-herbal-dark">
              {group.totalCount > 1 ? `All ${group.totalCount} Taken` : 'Taken'}
            </Text>
          </View>
        ) : hasSomeTaken ? (
          <View className="px-3 py-1.5 rounded-xl bg-terracotta-tint dark:bg-terracotta-dark-tint border border-terracotta/40 dark:border-terracotta-dark/40">
            <Text className="text-xs font-bold text-terracotta dark:text-terracotta-dark">
              {group.takenCount} of {group.totalCount} Taken
            </Text>
          </View>
        ) : isAllSkipped ? (
          <View className="px-3 py-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark">
            <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
              Skipped
            </Text>
          </View>
        ) : (
          <View className="px-3 py-1.5 rounded-xl bg-sage-tint dark:bg-sage-dark-tint border border-sage/40 dark:border-sage-dark/40">
            <Text className="text-xs font-bold text-sage dark:text-sage-dark">
              {group.totalCount} {group.totalCount === 1 ? 'Med' : 'Meds'}
            </Text>
          </View>
        )}
      </View>

      {/* Medicines List Inside this Routine Card */}
      <View className="rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark overflow-hidden divide-y divide-subtle-border dark:divide-subtle-border-dark">
        {group.doses.map((dose) => {
          const isDoseTaken = dose.status === 'taken';
          const isDoseSkipped = dose.status === 'skipped';

          return (
            <Pressable
              key={dose.scheduleId}
              onPress={() => onToggleDose(dose)}
              accessibilityRole="button"
              accessibilityLabel={`${dose.medicineName}, ${dose.dosage}. Status: ${dose.status}. Tap to toggle.`}
              className="min-h-[56px] p-3.5 flex-row items-center justify-between gap-3 active:bg-card-selected">
              {/* Checkbox / Status Circle */}
              <View className="w-8 h-8 rounded-full items-center justify-center">
                {isDoseTaken ? (
                  <Ionicons name="checkmark-circle" size={26} color={colors.success} />
                ) : isDoseSkipped ? (
                  <Ionicons name="close-circle-outline" size={26} color={colors.warning} />
                ) : (
                  <Ionicons name="ellipse-outline" size={26} color={colors.textSecondary} />
                )}
              </View>

              {/* Medicine Name & Dosage */}
              <View className="flex-1 min-w-0 pr-1">
                <View className="flex-row items-baseline gap-2 flex-wrap">
                  <Text
                    numberOfLines={1}
                    className={`text-base font-bold ${
                      isDoseTaken
                        ? 'text-charcoal dark:text-charcoal-dark line-through opacity-70'
                        : 'text-charcoal dark:text-charcoal-dark'
                    }`}>
                    {dose.medicineName}
                  </Text>
                  <Text className="text-sm font-bold text-terracotta dark:text-terracotta-dark">
                    {dose.dosage}
                  </Text>
                </View>

                {dose.instructions ? (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
                    <Text
                      numberOfLines={1}
                      className="text-xs font-medium text-umber dark:text-umber-dark">
                      {dose.instructions}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Status Text Indicator */}
              <View className="items-end shrink-0">
                {isDoseTaken ? (
                  <Text className="text-xs font-semibold text-herbal dark:text-herbal-dark">
                    {dose.loggedAt ? formatTo12Hour(dose.loggedAt) : 'Taken'}
                  </Text>
                ) : isDoseSkipped ? (
                  <Text className="text-xs font-semibold text-amber-700 dark:text-amber-500">
                    Skipped
                  </Text>
                ) : (
                  <Text className="text-xs font-bold text-sage dark:text-sage-dark">
                    Tap to check
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Action Footer: Take All / Skip All / Completed Confirmation */}
      {hasPending ? (
        <View className="flex-row items-center gap-2.5 pt-1">
          <PrimaryButton
            label={
              group.doses.length === 1
                ? 'Take Dose'
                : hasSomeTaken
                ? `Take Remaining (${group.pendingCount})`
                : `Take All (${group.totalCount} Meds)`
            }
            icon={<Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />}
            variant="primary"
            onPress={() => onTakeAll(pendingDoses)}
            className="flex-[2] min-h-[48px]"
          />
          <PrimaryButton
            label="Skip All"
            icon={<Ionicons name="close" size={18} color={colors.primary} />}
            variant="outline"
            onPress={() => onSkipAll(pendingDoses)}
            className="flex-1 min-h-[48px]"
          />
        </View>
      ) : (
        <View className="flex-row items-center justify-between pt-1 border-t border-subtle-border dark:border-subtle-border-dark">
          <View className="flex-row items-center gap-1.5 flex-1 pr-2">
            <Ionicons
              name={isAllTaken ? 'checkmark-done-circle' : 'close-circle-outline'}
              size={18}
              color={isAllTaken ? colors.success : colors.warning}
            />
            <Text className="text-xs font-medium text-umber dark:text-umber-dark">
              {isAllTaken
                ? `All ${group.totalCount} medicines taken for this routine`
                : 'All medicines in this routine marked as skipped'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              // Untoggle / reset all back to pending
              group.doses.forEach((d) => onToggleDose(d));
            }}
            className="min-h-[44px] min-w-[64px] items-center justify-center px-2 active:opacity-75"
            accessibilityRole="button"
            accessibilityLabel="Change status of medicines in this routine">
            <Text className="text-xs font-bold text-sage dark:text-sage-dark underline">
              Change
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};
