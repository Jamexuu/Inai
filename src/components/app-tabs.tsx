import React, { useEffect, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScalePressable } from '@/components/ui/scale-pressable';

type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

interface TabConfig {
  name: string;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    name: 'index',
    label: 'Today',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
    accessibilityLabel: 'Today tab, daily medicine and blood sugar routine',
  },
  explore: {
    name: 'explore',
    label: 'Medicines',
    activeIcon: 'medkit',
    inactiveIcon: 'medkit-outline',
    accessibilityLabel: 'Medicines tab, active prescriptions and history',
  },
  sugar: {
    name: 'sugar',
    label: 'Sugar',
    activeIcon: 'water',
    inactiveIcon: 'water-outline',
    accessibilityLabel: 'Sugar tab, blood glucose monitoring and trends',
  },
  bp: {
    name: 'bp',
    label: 'BP',
    activeIcon: 'heart',
    inactiveIcon: 'heart-outline',
    accessibilityLabel: 'Blood Pressure tab, daily readings and reminders',
  },
  history: {
    name: 'history',
    label: 'History',
    activeIcon: 'time',
    inactiveIcon: 'time-outline',
    accessibilityLabel: 'History tab, past intake records',
  },
};

/**
 * SlidingTabBar:
 * Renders a warm light bottom tab bar featuring an animated sliding pill.
 * As Mom switches tabs, the pill smoothly glides to the active tab,
 * allowing her eyes to follow along and reinforcing spatial memory.
 */
function SlidingTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[scheme];
  const isAndroid = Platform.OS === 'android';
  const bottomPadding =
    insets.bottom > 0 ? insets.bottom + 6 : isAndroid ? 12 : 8;

  // Filter to visible tabs (exclude hidden routes like settings or meals)
  const visibleRoutes = state.routes.filter((route) => {
    const descriptor = descriptors[route.key];
    const rawOptions = descriptor?.options as
      | { href?: string | null }
      | undefined;
    const isHidden = rawOptions?.href === null;
    return !isHidden && TAB_CONFIGS[route.name] !== undefined;
  });

  const tabCount = Math.max(visibleRoutes.length, 1);
  const [containerWidth, setContainerWidth] = useState(
    () => Dimensions.get('window').width
  );

  // Check if active route should hide bottom tab bar (e.g. settings)
  const currentRoute = state.routes[state.index];
  const currentDescriptor = descriptors[currentRoute?.key];
  const currentOptions = currentDescriptor?.options as
    | { tabBarStyle?: { display?: string } }
    | undefined;
  const isTabBarHidden =
    currentRoute?.name === 'settings' ||
    currentOptions?.tabBarStyle?.display === 'none';

  const activeRouteKey = state.routes[state.index]?.key;
  const foundIndex = visibleRoutes.findIndex((r) => r.key === activeRouteKey);
  const lastActiveIndex = useRef(0);
  if (foundIndex >= 0) {
    lastActiveIndex.current = foundIndex;
  }
  const activeVisibleIndex = lastActiveIndex.current;

  const tabWidth = containerWidth / tabCount;
  // Compact pill sized specifically for the icon (no borders, soft solid sage tint)
  const pillWidth = Math.min(48, Math.max(tabWidth - 8, 28));
  const pillHeight = 28;
  const pillLeftOffset = (tabWidth - pillWidth) / 2;

  // Animated translation along X axis
  const translateX = useRef(
    new Animated.Value(activeVisibleIndex * tabWidth)
  ).current;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isTabBarHidden) return;
    const targetX = activeVisibleIndex * tabWidth;
    if (isFirstRender.current) {
      translateX.setValue(targetX);
      isFirstRender.current = false;
    } else {
      // Gentle, purposeful spring motion aligned with anti-slop MOTION 1
      Animated.spring(translateX, {
        toValue: targetX,
        friction: 8,
        tension: 55,
        useNativeDriver: true,
      }).start();
    }
  }, [activeVisibleIndex, tabWidth, translateX, isTabBarHidden]);

  // Return null AFTER all hooks have executed unconditionally
  if (isTabBarHidden) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 4,
        paddingBottom: bottomPadding,
      }}>
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - containerWidth) > 1) {
            setContainerWidth(w);
          }
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          position: 'relative',
          height: 50,
          width: '100%',
        }}>
        {/* Animated Sliding Pill Indicator - Centered behind the active icon, without borders */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 3,
            left: pillLeftOffset,
            width: pillWidth,
            height: pillHeight,
            borderRadius: 14,
            backgroundColor: isDark ? '#23332C' : '#E9F0EC', // Solid sage tint (NO GRADIENTS, NO BORDERS)
            transform: [{ translateX }],
          }}
        />

        {/* Tab Items */}
        {visibleRoutes.map((route, index) => {
          const isFocused = index === activeVisibleIndex;
          const config = TAB_CONFIGS[route.name];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <ScalePressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.accessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              scaleTo={0.92}
              opacityTo={0.8}
              style={{
                flex: 1,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 2,
              }}>
              {/* Icon container - exactly matches sliding pill size and alignment */}
              <View
                style={{
                  width: pillWidth,
                  height: pillHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Ionicons
                  name={isFocused ? config.activeIcon : config.inactiveIcon}
                  size={20}
                  color={
                    isFocused ? colors.primary : colors.textSecondary
                  }
                />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: isFocused ? '700' : '600',
                  color: isFocused
                    ? colors.primary
                    : colors.textSecondary,
                  marginTop: 2,
                }}>
                {config.label}
              </Text>
            </ScalePressable>
          );
        })}
      </View>
    </View>
  );
}

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <SlidingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Medicines',
        }}
      />
      <Tabs.Screen
        name="sugar"
        options={{
          title: 'Sugar',
        }}
      />
      <Tabs.Screen
        name="bp"
        options={{
          title: 'BP',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
        }}
      />
      {/* Hidden tab screen for meals so any existing references or routes don't crash */}
      <Tabs.Screen
        name="meals"
        options={{
          href: null,
          title: 'Meals',
        }}
      />
      {/* Hidden tab screen for settings so it is accessible via router navigation */}
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'Settings',
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
