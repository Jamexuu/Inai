import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot className="h-full" />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton icon="calendar-outline" activeIcon="calendar">
              Today
            </TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="medkit-outline" activeIcon="medkit">
              Medicines
            </TabButton>
          </TabTrigger>
          <TabTrigger name="sugar" href="/sugar" asChild>
            <TabButton icon="water-outline" activeIcon="water">
              Sugar
            </TabButton>
          </TabTrigger>
          <TabTrigger name="bp" href="/bp" asChild>
            <TabButton icon="heart-outline" activeIcon="heart">
              BP
            </TabButton>
          </TabTrigger>
          <TabTrigger name="history" href="/history" asChild>
            <TabButton icon="time-outline" activeIcon="time">
              History
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export function TabButton({
  children,
  isFocused,
  icon,
  activeIcon,
  ...props
}: TabButtonProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme];

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={String(children)}
      className="active:opacity-75">
      <View
        className={`min-h-[44px] px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 transition-all duration-200 ease-out ${
          isFocused
            ? 'bg-sage shadow-sm'
            : isDark
            ? 'bg-[#252320]'
            : 'bg-[#F2ECE4]'
        }`}>
        <Ionicons
          name={isFocused ? activeIcon : icon}
          size={16}
          color={isFocused ? '#FFFFFF' : colors.textSecondary}
        />
        <Text
          className={`text-sm font-bold transition-colors duration-200 ${
            isFocused ? 'text-white' : isDark ? 'text-[#FAF7F2]' : 'text-[#282522]'
          }`}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View className="absolute bottom-0 w-full p-3 justify-center items-center flex-row pointer-events-auto">
      <View
        style={{
          backgroundColor: colors.backgroundCard,
          borderColor: colors.border,
        }}
        className="py-2.5 px-4 rounded-2xl border-[1.5px] flex-row items-center justify-between flex-grow max-w-[620px]">
        <View className="flex-row items-center gap-2 pl-1 pr-3">
          <View className="w-7 h-7 rounded-lg bg-sage/15 items-center justify-center">
            <Ionicons name="heart" size={16} color={colors.primary} />
          </View>
          <Text
            style={{ color: colors.text }}
            className="text-base font-bold tracking-wide">
            Inai
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-1.5">
          {props.children}
        </View>
      </View>
    </View>
  );
}
