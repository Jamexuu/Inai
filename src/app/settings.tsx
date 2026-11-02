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
import { SectionHeader, PrimaryButton } from '@/components/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const setThemeMode = useAppStore((state) => state.setThemeMode);

  const [notificationStatus, setNotificationStatus] = useState<string>('Checking...');
  const [exactAlarmsAllowed, setExactAlarmsAllowed] = useState<boolean>(true);

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

  const themeOptions: {
    key: AppThemeMode;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      key: 'light',
      title: 'Light Mode',
      description: 'Warm linen and soft ivory, ideal for everyday daytime reading.',
      icon: 'sunny-outline',
    },
    {
      key: 'dark',
      title: 'Dark Mode',
      description: 'Deep warm slate, comfortable and easy on the eyes in low light.',
      icon: 'moon-outline',
    },
    {
      key: 'system',
      title: 'Follow System',
      description: 'Automatically match your phone’s system light or dark setting.',
      icon: 'phone-portrait-outline',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-canvas">
      <ScrollView contentContainerClassName="px-4 pb-12">
        {/* Header with Back Button */}
        <View className="pt-3 pb-3 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-surface border border-subtle-border active:bg-card-selected"
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color="#3D5A50" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-[26px] font-bold text-charcoal">
              Settings
            </Text>
            <Text className="text-sm font-semibold text-umber">
              Display theme and routine preferences for Mom.
            </Text>
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
              <Pressable
                key={opt.key}
                onPress={() => setThemeMode(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${opt.title}: ${opt.description}`}
                className={`min-h-[64px] rounded-2xl border-[1.5px] p-4 flex-row items-center justify-between ${
                  isSelected
                    ? 'bg-sage-tint border-sage'
                    : 'bg-card border-subtle-border active:bg-surface'
                }`}>
                <View className="flex-row items-center gap-3 flex-1 pr-3">
                  <View
                    className={`w-11 h-11 rounded-xl items-center justify-center border ${
                      isSelected
                        ? 'bg-sage border-sage'
                        : 'bg-surface border-subtle-border'
                    }`}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={isSelected ? '#FFFFFF' : '#3D5A50'}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-bold text-charcoal">
                      {opt.title}
                    </Text>
                    <Text className="text-xs font-semibold text-umber">
                      {opt.description}
                    </Text>
                  </View>
                </View>

                {/* Radio checkmark indicator */}
                <View
                  className={`w-6 h-6 rounded-full border-[2px] items-center justify-center ${
                    isSelected
                      ? 'border-sage bg-sage'
                      : 'border-subtle-border bg-surface'
                  }`}>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Display Comfort & Navigation Card */}
        <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-3 mb-4">
          <View className="flex-row items-center gap-2.5">
            <View className="w-9 h-9 rounded-xl bg-terracotta-tint border border-terracotta/20 items-center justify-center">
              <Ionicons name="phone-portrait-outline" size={18} color="#C46849" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-charcoal">
                Display & Navigation
              </Text>
              <Text className="text-xs font-semibold text-umber">
                Designed for readability and accessibility
              </Text>
            </View>
          </View>

          <View className="gap-2 pt-1">
            <View className="flex-row items-start gap-2.5 bg-surface p-3 rounded-xl border border-subtle-border">
              <Ionicons name="notifications" size={18} color="#3D5A50" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-charcoal">
                  Phone Notification Bar
                </Text>
                <Text className="text-xs font-medium text-umber mt-0.5">
                  Always clearly visible at the top with high-contrast clock, battery, and notification icons.
                </Text>
              </View>
            </View>

            <View className="flex-row items-start gap-2.5 bg-surface p-3 rounded-xl border border-subtle-border">
              <Ionicons name="menu" size={18} color="#3D5A50" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-charcoal">
                  Bottom Navigation Bar
                </Text>
                <Text className="text-xs font-medium text-umber mt-0.5">
                  Kept in high-visibility warm light linen across all modes for ease of navigation.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Routine Alarms & Offline Status */}
        <SectionHeader
          title="Routine Alarms"
          subtitle="Local offline reminder status"
        />

        <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-3 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-herbal-tint border border-herbal/20 items-center justify-center">
                <Ionicons name="alarm-outline" size={20} color="#2E684D" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-charcoal">
                  Alarm Reminders
                </Text>
                <Text className="text-xs font-semibold text-umber">
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
              <View className="px-3 py-1.5 rounded-xl bg-herbal-tint border border-herbal flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={14} color="#2E684D" />
                <Text className="text-xs font-bold text-herbal">Active</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center gap-2 bg-surface p-3 rounded-xl border border-subtle-border">
            <MaterialCommunityIcons name="shield-check" size={20} color="#2E684D" />
            <Text className="text-xs font-medium text-umber flex-1">
              100% Offline: reminders wake the device locally without needing Wi-Fi or data connection.
            </Text>
          </View>
        </View>

        {/* About Card */}
        <View className="rounded-2xl border border-subtle-border bg-surface p-4 items-center gap-1.5">
          <Text className="text-base font-bold text-charcoal">
            Inai
          </Text>
          <Text className="text-xs font-medium text-umber text-center">
            A digital helper that gently takes care of Mom's daily routine.
          </Text>
          <Text className="text-xs font-semibold text-umber mt-1">
            Version 1.0.0 · Offline SQLite Database
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
