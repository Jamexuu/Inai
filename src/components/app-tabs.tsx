import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Platform } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const isAndroid = Platform.OS === 'android';
  // Generous clearance above Android 3-button navigation bar (or iOS home indicator)
  // so labels are well clear of ≡, ○, ⮌
  const systemNavClearance = Math.max(insets.bottom, isAndroid ? 44 : 20);
  const bottomPadding = systemNavClearance + (isAndroid ? 14 : 6);
  const tabContentHeight = 56;
  const tabHeight = tabContentHeight + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          borderWidth: 0,
          borderColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          height: tabContentHeight,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                backgroundColor: focused ? '#EAEFEA' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Medicines',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 52,
                height: 28,
                borderRadius: 14,
                backgroundColor: focused ? '#EAEFEA' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={focused ? 'medkit' : 'medkit-outline'}
                size={20}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
