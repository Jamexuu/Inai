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
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 12 : (isAndroid ? 16 : 12);
  const paddingTop = 6;
  const tabHeight = 48 + paddingTop + bottomPadding;

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
          paddingTop,
          paddingBottom: bottomPadding,
          height: tabHeight,
        },
        tabBarItemStyle: {
          paddingVertical: 1,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-10 h-6 rounded-full items-center justify-center ${
                focused ? 'bg-sage-tint' : 'bg-transparent'
              }`}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={18}
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
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-10 h-6 rounded-full items-center justify-center ${
                focused ? 'bg-sage-tint' : 'bg-transparent'
              }`}>
              <Ionicons
                name={focused ? 'medkit' : 'medkit-outline'}
                size={18}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meals"
        options={{
          title: 'Meals',
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-10 h-6 rounded-full items-center justify-center ${
                focused ? 'bg-sage-tint' : 'bg-transparent'
              }`}>
              <Ionicons
                name={focused ? 'restaurant' : 'restaurant-outline'}
                size={18}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bp"
        options={{
          title: 'BP',
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-10 h-6 rounded-full items-center justify-center ${
                focused ? 'bg-sage-tint' : 'bg-transparent'
              }`}>
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={18}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <View
              className={`w-10 h-6 rounded-full items-center justify-center ${
                focused ? 'bg-sage-tint' : 'bg-transparent'
              }`}>
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={18}
                color={focused ? colors.primary : colors.textMuted}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
