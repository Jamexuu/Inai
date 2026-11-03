import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/ui/primary-button';
import { notificationProvider } from '@/notifications';
import { settingsService } from '@/services/settings.service';
import { useTheme } from '@/hooks/use-theme';

interface PermissionPromptModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export const PermissionPromptModal: React.FC<PermissionPromptModalProps> = ({
  visible,
  onAllow,
  onDeny,
}) => {
  const colors = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAllow = async () => {
    setIsSubmitting(true);
    try {
      await notificationProvider.requestPermissions();
      await settingsService.markPermissionsPromptDecided();
      onAllow();
    } catch (e) {
      console.warn('Error requesting permissions:', e);
      await settingsService.markPermissionsPromptDecided();
      onAllow();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    try {
      await settingsService.markPermissionsPromptDecided();
    } finally {
      onDeny();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      accessibilityViewIsModal={true}
      statusBarTranslucent={true}>
      <View className="flex-1 bg-black/60 justify-center items-center px-4 py-8">
        <View className="w-full max-w-[420px] bg-card dark:bg-card-dark rounded-3xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark p-6 gap-4">
          {/* Header Icon */}
          <View className="w-16 h-16 rounded-2xl bg-sage-tint dark:bg-sage-dark-tint border border-sage/30 items-center justify-center self-center">
            <Ionicons name="notifications-outline" size={32} color={colors.primary} />
          </View>

          {/* Title & Description */}
          <View className="items-center gap-1.5">
            <Text className="text-[22px] font-bold text-charcoal dark:text-charcoal-dark text-center leading-[28px]">
              Let Inai Remind Mom for Medicines & Routine?
            </Text>
            <Text className="text-[15px] font-medium text-umber dark:text-umber-dark text-center leading-[22px]">
              Inai helps Mom keep a calm, steady daily routine with gentle notifications and action buttons to log doses with one tap.
            </Text>
          </View>

          {/* Benefits List */}
          <View className="rounded-2xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark p-3.5 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-sage-tint dark:bg-sage-dark-tint items-center justify-center">
                <Ionicons name="medical-outline" size={18} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal dark:text-charcoal-dark">
                  Medicine Reminders
                </Text>
                <Text className="text-[13px] font-medium text-umber dark:text-umber-dark">
                  Timely notifications with quick "Mark as Taken" action.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-terracotta-tint dark:bg-terracotta-dark-tint items-center justify-center">
                <Ionicons name="water-outline" size={18} color={colors.secondary} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal dark:text-charcoal-dark">
                  Blood Sugar Tracking
                </Text>
                <Text className="text-[13px] font-medium text-umber dark:text-umber-dark">
                  Gentle prompts for fasting and post-meal glucose logs.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-brick-tint dark:bg-brick-dark-tint items-center justify-center">
                <Ionicons name="heart-outline" size={18} color={colors.error} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal dark:text-charcoal-dark">
                  Blood Pressure Checks
                </Text>
                <Text className="text-[13px] font-medium text-umber dark:text-umber-dark">
                  Prompts to rest and record morning and evening readings.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-herbal-tint dark:bg-herbal-dark-tint items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal dark:text-charcoal-dark">
                  100% Offline & Private
                </Text>
                <Text className="text-[13px] font-medium text-umber dark:text-umber-dark">
                  Scheduled locally on Mom's device. No internet required.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2.5 pt-1">
            <PrimaryButton
              label={isSubmitting ? 'Setting up...' : 'Allow Routine Reminders'}
              icon={
                isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                )
              }
              variant="primary"
              disabled={isSubmitting}
              onPress={handleAllow}
              className="min-h-[50px]"
            />
            <PrimaryButton
              label="Not Now"
              variant="ghost"
              disabled={isSubmitting}
              onPress={handleDeny}
              className="min-h-[44px]"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
