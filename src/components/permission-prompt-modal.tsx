import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '@/components/ui/primary-button';
import { notificationProvider } from '@/notifications';
import { settingsService } from '@/services/settings.service';

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
      <View className="flex-1 bg-charcoal/50 justify-center items-center px-4 py-8">
        <View className="w-full max-w-[420px] bg-card rounded-3xl border-[1.5px] border-subtle-border p-6 shadow-xl gap-4">
          {/* Header Icon */}
          <View className="w-16 h-16 rounded-2xl bg-sage/15 border border-sage/30 items-center justify-center self-center">
            <Ionicons name="notifications-outline" size={32} color="#3D5A50" />
          </View>

          {/* Title & Description */}
          <View className="items-center gap-1.5">
            <Text className="text-[22px] font-bold text-charcoal text-center leading-[28px]">
              Allow Routine Alarms & Notifications?
            </Text>
            <Text className="text-[15px] font-normal text-umber text-center leading-[22px]">
              Inai helps Mom keep a steady, calm daily routine with gentle, loud alarms that wake the phone on time.
            </Text>
          </View>

          {/* Benefits List */}
          <View className="rounded-2xl bg-surface border border-subtle-border p-3.5 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-sage/15 items-center justify-center">
                <Ionicons name="medical-outline" size={18} color="#3D5A50" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal">
                  Medicine Alarms
                </Text>
                <Text className="text-[12px] text-umber">
                  Reliable reminders for morning, afternoon & evening doses.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-terracotta/15 items-center justify-center">
                <Ionicons name="restaurant-outline" size={18} color="#C46849" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal">
                  Meal Routine
                </Text>
                <Text className="text-[12px] text-umber">
                  Gentle prompts for Breakfast, Lunch, Snack & Dinner.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-brick/15 items-center justify-center">
                <Ionicons name="heart-outline" size={18} color="#B84A39" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal">
                  Blood Pressure Checks
                </Text>
                <Text className="text-[12px] text-umber">
                  Prompts to rest and record morning & evening BP.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-xl bg-herbal/15 items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={18} color="#2E684D" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-charcoal">
                  100% Offline & Private
                </Text>
                <Text className="text-[12px] text-umber">
                  Scheduled locally on Mom's device. No internet required.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2.5 pt-1">
            <PrimaryButton
              label={isSubmitting ? 'Enabling...' : 'Allow Alarms & Notifications'}
              icon={
                isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                )
              }
              variant="primary"
              disabled={isSubmitting}
              onPress={handleAllow}
              className="min-h-[50px]"
            />
            <PrimaryButton
              label="Maybe Later"
              variant="outline"
              disabled={isSubmitting}
              onPress={handleDeny}
              className="min-h-[46px]"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

