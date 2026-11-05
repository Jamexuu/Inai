import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app.store';
import { AppThemeMode } from '@/services/settings.service';
import { notificationProvider } from '@/notifications';
import { SectionHeader, PrimaryButton, ScalePressable } from '@/components/ui';
import { UserNameModal } from '@/components/user-name-modal';
import { userProfileService } from '@/services/user-profile.service';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useTheme();
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const userName = useAppStore((state) => state.userName);
  const setUserName = useAppStore((state) => state.setUserName);

  const [notificationStatus, setNotificationStatus] = useState<string>('Checking...');
  const [exactAlarmsAllowed, setExactAlarmsAllowed] = useState<boolean>(true);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  useEffect(() => {
    async function checkPerms() {
      try {
        const perms = await notificationProvider.checkAlarmPermissions();
        if (perms.notificationsPermitted) {
          setNotificationStatus('Enabled');
        } else {
          setNotificationStatus('Needs Permission');
        }
        setExactAlarmsAllowed(perms.exactAlarmPermitted);
      } catch {
        setNotificationStatus('Enabled');
      }
    }
    checkPerms();
  }, []);

  const handleRequestPermissions = async () => {
    try {
      await notificationProvider.requestPermissions();
      const perms = await notificationProvider.checkAlarmPermissions();
      setNotificationStatus(perms.notificationsPermitted ? 'Enabled' : 'Needs Permission');
      setExactAlarmsAllowed(perms.exactAlarmPermitted);
    } catch (e) {
      console.warn('Error requesting permissions:', e);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationProvider.displayAlarmNow('Metformin', '500 mg');
    } catch (e) {
      console.warn('Failed to display test notification:', e);
    }
  };

  const themeOptions: {
    key: AppThemeMode;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: 'light',
      title: 'Light Mode (Default)',
      description: 'Warm linen and soft ivory, ideal for comfortable daytime reading.',
      icon: 'sunny-outline',
    },
    {
      key: 'dark',
      title: 'Dark Mode',
      description: 'Deep warm slate, comfortable and easy on the eyes in low light.',
      icon: 'moon-outline',
    },
  ];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{ backgroundColor: colors.background }}
      className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScrollView contentContainerClassName="px-4 pb-12">
        {/* Header with Back Button */}
        <View className="pt-3 pb-3 flex-row items-center gap-3">
          <ScalePressable
            onPress={() => router.back()}
            scaleTo={0.92}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </ScalePressable>
          <View className="flex-1">
            <Text className="text-[26px] font-bold text-charcoal dark:text-charcoal-dark">
              Settings
            </Text>
            <Text className="text-sm font-semibold text-umber dark:text-umber-dark">
              Display theme and personal preferences.
            </Text>
          </View>
        </View>

        {/* Personal Profile Section */}
        <SectionHeader
          title="Personal Profile"
          subtitle="What Inai calls you in greetings and reports"
        />

        <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 gap-3 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-11 h-11 rounded-xl bg-sage-tint dark:bg-sage-dark-tint border border-sage/20 items-center justify-center">
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                  {userName}
                </Text>
                <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                  Inai calls you: "{userName}"
                </Text>
              </View>
            </View>

            <ScalePressable
              onPress={() => setIsNameModalOpen(true)}
              scaleTo={0.92}
              className="min-h-[44px] px-3.5 flex-row items-center gap-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-subtle-border dark:border-subtle-border-dark active:bg-card-selected"
              accessibilityRole="button"
              accessibilityLabel={`Change name, currently ${userName}`}>
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <Text className="text-xs font-bold text-sage dark:text-sage-dark">Change</Text>
            </ScalePressable>
          </View>
        </View>

        {/* Theme / Appearance Section */}
        <SectionHeader
          title="Display Theme"
          subtitle="Select Light or Dark mode"
        />

        <View className="gap-2.5 mb-4" accessibilityRole="radiogroup">
          {themeOptions.map((opt) => {
            const isSelected = themeMode === opt.key;
            return (
              <ScalePressable
                key={opt.key}
                onPress={() => setThemeMode(opt.key)}
                scaleTo={0.96}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${opt.title}: ${opt.description}`}
                className={`min-h-[64px] rounded-2xl border-[1.5px] p-4 flex-row items-center justify-between ${
                  isSelected
                    ? 'bg-sage-tint dark:bg-sage-dark-tint border-sage dark:border-sage-dark'
                    : 'bg-card dark:bg-card-dark border-subtle-border dark:border-subtle-border-dark active:bg-surface'
                }`}>
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View
                    className={`w-11 h-11 rounded-xl items-center justify-center border ${
                      isSelected
                        ? 'bg-sage dark:bg-sage-dark border-sage dark:border-sage-dark'
                        : 'bg-surface dark:bg-surface-dark border-subtle-border dark:border-subtle-border-dark'
                    }`}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={isSelected ? (opt.key === 'dark' ? '#101F18' : '#FFFFFF') : colors.primary}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                      {opt.title}
                    </Text>
                    <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                      {opt.description}
                    </Text>
                  </View>
                </View>

                {/* Radio checkmark indicator */}
                <View
                  className={`w-6 h-6 rounded-full border-[2px] items-center justify-center ${
                    isSelected
                      ? 'border-sage dark:border-sage-dark bg-sage dark:bg-sage-dark'
                      : 'border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark'
                  }`}>
                  {isSelected ? (
                    <Ionicons name="checkmark-sharp" size={16} color={opt.key === 'dark' ? '#101F18' : '#FFFFFF'} />
                  ) : null}
                </View>
              </ScalePressable>
            );
          })}
        </View>

        {/* Display Comfort & Navigation Card */}
        <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 gap-3 mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-terracotta-tint dark:bg-terracotta-dark-tint border border-terracotta/20 dark:border-terracotta-dark/20 items-center justify-center">
              <Ionicons name="phone-portrait-outline" size={18} color={colors.secondary} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                Display & Navigation
              </Text>
              <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                Designed for readability and accessibility
              </Text>
            </View>
          </View>

          <View className="gap-2 pt-1">
            <View className="flex-row items-start gap-2.5 bg-surface dark:bg-surface-dark p-3 rounded-xl border border-subtle-border dark:border-subtle-border-dark">
              <Ionicons name="notifications" size={18} color={colors.primary} className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
                  Phone Notification Bar
                </Text>
                <Text className="text-xs font-medium text-umber dark:text-umber-dark mt-0.5">
                  Always clearly visible at the top with high-contrast clock, battery, and notification icons.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5 bg-surface dark:bg-surface-dark p-3 rounded-xl border border-subtle-border dark:border-subtle-border-dark">
              <Ionicons name="menu" size={18} color={colors.primary} className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
                  Bottom Navigation Bar
                </Text>
                <Text className="text-xs font-medium text-umber dark:text-umber-dark mt-0.5">
                  Seamlessly matches your theme with clear icons and comfortable touch targets across all tabs.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Routine Reminders & Offline Status */}
        <SectionHeader
          title="Routine Reminders"
          subtitle="Local offline notification status"
        />

        <View className="rounded-2xl border-[1.5px] border-subtle-border dark:border-subtle-border-dark bg-card dark:bg-card-dark p-4 gap-3 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-herbal-tint dark:bg-herbal-dark-tint border border-herbal/20 dark:border-herbal-dark/20 items-center justify-center">
                <Ionicons name="notifications-outline" size={20} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
                  Medicine & Routine Reminders
                </Text>
                <Text className="text-xs font-semibold text-umber dark:text-umber-dark">
                  Status: {notificationStatus}
                </Text>
              </View>
            </View>

            {notificationStatus !== 'Enabled' ? (
              <PrimaryButton
                label="Enable"
                variant="outline"
                onPress={handleRequestPermissions}
                className="min-h-[44px] px-3.5"
              />
            ) : (
              <View className="px-3 py-1.5 rounded-xl bg-herbal-tint dark:bg-herbal-dark-tint border border-herbal dark:border-herbal-dark flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text className="text-xs font-bold text-herbal dark:text-herbal-dark">Active</Text>
              </View>
            )}
          </View>

          {/* Test Notification Action Row */}
          <View className="flex-row items-center justify-between pt-2 border-t border-subtle-border dark:border-subtle-border-dark">
            <View className="flex-1 pr-2">
              <Text className="text-sm font-bold text-charcoal dark:text-charcoal-dark">
                Test Reminder Banner
              </Text>
              <Text className="text-xs font-medium text-umber dark:text-umber-dark">
                Preview normal notification with 'Mark as Taken' action
              </Text>
            </View>
            <PrimaryButton
              label="Test"
              variant="outline"
              icon={<Ionicons name="notifications" size={16} color={colors.primary} />}
              onPress={handleTestNotification}
              className="min-h-[40px] px-3"
            />
          </View>

          <View className="flex-row items-center gap-2 bg-surface dark:bg-surface-dark p-3 rounded-xl border border-subtle-border dark:border-subtle-border-dark">
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.success} />
            <Text className="text-xs font-medium text-umber dark:text-umber-dark flex-1">
              100% Offline: reminders wake the device locally without needing Wi-Fi or data connection.
            </Text>
          </View>
        </View>

        {/* About Card */}
        <View className="rounded-2xl border border-subtle-border dark:border-subtle-border-dark bg-surface dark:bg-surface-dark p-4 items-center gap-1.5">
          <Text className="text-base font-bold text-charcoal dark:text-charcoal-dark">
            Inai
          </Text>
          <Text className="text-xs font-medium text-umber dark:text-umber-dark text-center">
            A digital helper that gently takes care of your daily routine.
          </Text>
          <Text className="text-xs font-semibold text-umber dark:text-umber-dark mt-1">
            Version 1.0.0 · Offline SQLite Database
          </Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <UserNameModal
        visible={isNameModalOpen}
        initialName={userName}
        canDismiss={true}
        onSave={async (newName) => {
          await userProfileService.saveUserName(newName);
          setUserName(newName);
          setIsNameModalOpen(false);
        }}
        onClose={() => setIsNameModalOpen(false)}
      />
    </SafeAreaView>
  );
}
