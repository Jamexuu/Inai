import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export interface SkeletonBoxProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
}

/**
 * Solid warm placeholder block with gentle, calm breathing pulse.
 * Strictly NO gradients, fits warm linen theme.
 */
export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height = 16,
  borderRadius = 8,
  className = '',
}) => {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.82,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          backgroundColor: '#E5E0D8',
          borderRadius,
          ...(typeof width === 'number' || typeof width === 'string'
            ? { width: width as any }
            : {}),
          ...(typeof height === 'number' || typeof height === 'string'
            ? { height: height as any }
            : {}),
        },
      ]}
      className={className}
    />
  );
};

/**
 * Skeleton layout for Home Dashboard (Today's Routine)
 */
export const HomeSkeleton: React.FC = () => (
  <View className="gap-3 pt-1">
    {/* Hero Card Skeleton */}
    <View className="rounded-2xl border-2 border-subtle-border bg-card p-4 gap-2.5">
      <View className="flex-row justify-between items-center">
        <SkeletonBox width={120} height={14} />
        <SkeletonBox width={65} height={16} />
      </View>
      <SkeletonBox width="65%" height={24} borderRadius={6} />
      <SkeletonBox width="40%" height={18} borderRadius={6} />
      <View className="mt-2">
        <SkeletonBox width="100%" height={48} borderRadius={12} />
      </View>
    </View>

    {/* Section Header */}
    <View className="flex-row justify-between items-center pt-2">
      <SkeletonBox width={140} height={20} />
      <SkeletonBox width={60} height={36} borderRadius={10} />
    </View>

    {/* Medicine Cards */}
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-2.5">
      <View className="flex-row justify-between items-center">
        <SkeletonBox width={120} height={20} />
        <SkeletonBox width={75} height={32} borderRadius={8} />
      </View>
      <SkeletonBox width={90} height={16} />
      <SkeletonBox width="70%" height={14} />
    </View>

    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-2.5">
      <View className="flex-row justify-between items-center">
        <SkeletonBox width={140} height={20} />
        <SkeletonBox width={75} height={32} borderRadius={8} />
      </View>
      <SkeletonBox width={85} height={16} />
      <SkeletonBox width="60%" height={14} />
    </View>

    {/* Meals Section Header */}
    <View className="pt-2">
      <SkeletonBox width={120} height={20} />
    </View>

    {/* Meal Card */}
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-3.5 flex-row justify-between items-center">
      <View className="flex-row items-center gap-3 flex-1">
        <SkeletonBox width={40} height={40} borderRadius={12} />
        <View className="gap-1.5 flex-1">
          <SkeletonBox width={100} height={18} />
          <SkeletonBox width={60} height={14} />
        </View>
      </View>
      <SkeletonBox width={36} height={36} borderRadius={18} />
    </View>
  </View>
);

/**
 * Skeleton layout for Medicines Tab
 */
export const MedicinesSkeleton: React.FC = () => (
  <View className="gap-3 pt-1">
    {/* Add Button */}
    <SkeletonBox width="100%" height={48} borderRadius={12} />

    {/* Section Header */}
    <View className="flex-row justify-between items-center pt-2">
      <SkeletonBox width={160} height={20} />
      <SkeletonBox width={80} height={14} />
    </View>

    {/* Prescription Cards */}
    {[1, 2, 3].map((key) => (
      <View
        key={key}
        className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-2.5">
        <View className="flex-row justify-between items-start">
          <View className="gap-1.5 flex-1 pr-2">
            <SkeletonBox width="55%" height={22} />
            <SkeletonBox width="35%" height={16} />
          </View>
          <View className="flex-row items-center gap-2">
            <SkeletonBox width={45} height={24} borderRadius={6} />
            <SkeletonBox width={45} height={24} borderRadius={6} />
          </View>
        </View>
        <SkeletonBox width="80%" height={14} />
        <View className="flex-row gap-2 mt-1">
          <SkeletonBox width={90} height={26} borderRadius={8} />
          <SkeletonBox width={90} height={26} borderRadius={8} />
        </View>
      </View>
    ))}
  </View>
);

/**
 * Skeleton layout for Meals Tab
 */
export const MealsSkeleton: React.FC = () => (
  <View className="gap-3 pt-1">
    {/* Section Header */}
    <View className="flex-row justify-between items-center">
      <SkeletonBox width={160} height={20} />
      <SkeletonBox width={90} height={38} borderRadius={10} />
    </View>

    {/* Meal Cards */}
    {[1, 2, 3, 4].map((key) => (
      <View
        key={key}
        className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-3.5 flex-row justify-between items-center">
        <View className="flex-row items-center gap-3 flex-1">
          <SkeletonBox width={42} height={42} borderRadius={12} />
          <View className="gap-1.5 flex-1">
            <SkeletonBox width={110} height={18} />
            <SkeletonBox width={70} height={14} />
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <SkeletonBox width={32} height={32} borderRadius={8} />
          <SkeletonBox width={36} height={36} borderRadius={18} />
        </View>
      </View>
    ))}
  </View>
);

/**
 * Skeleton layout for Blood Pressure Tab
 */
export const BPSkeleton: React.FC = () => (
  <View className="gap-3 pt-1">
    {/* Daily Alarms Card */}
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-3">
      <View className="flex-row items-center gap-2.5">
        <SkeletonBox width={36} height={36} borderRadius={10} />
        <View className="gap-1 flex-1">
          <SkeletonBox width={140} height={16} />
          <SkeletonBox width={180} height={12} />
        </View>
      </View>
      <View className="gap-2">
        <SkeletonBox width="100%" height={46} borderRadius={10} />
        <SkeletonBox width="100%" height={46} borderRadius={10} />
      </View>
    </View>

    {/* Latest Reading Card */}
    <View className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-4 gap-3">
      <View className="flex-row justify-between items-center">
        <SkeletonBox width={110} height={14} />
        <SkeletonBox width={75} height={22} borderRadius={12} />
      </View>
      <SkeletonBox width={160} height={40} />
      <View className="flex-row justify-between items-center pt-2 border-t border-subtle-border">
        <SkeletonBox width={130} height={14} />
        <SkeletonBox width={45} height={20} borderRadius={6} />
      </View>
    </View>

    {/* History Section Header */}
    <View className="flex-row justify-between items-center pt-1">
      <SkeletonBox width={130} height={20} />
      <SkeletonBox width={95} height={38} borderRadius={10} />
    </View>

    {/* History Items */}
    {[1, 2].map((key) => (
      <View
        key={key}
        className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-3.5 gap-2">
        <View className="flex-row justify-between items-center">
          <SkeletonBox width={100} height={24} />
          <SkeletonBox width={70} height={20} borderRadius={10} />
        </View>
        <SkeletonBox width={150} height={14} />
      </View>
    ))}
  </View>
);

/**
 * Skeleton layout for History Tab
 */
export const HistorySkeleton: React.FC = () => (
  <View className="gap-3 pt-2">
    {/* Section Header */}
    <View className="flex-row justify-between items-center">
      <SkeletonBox width={130} height={20} />
      <SkeletonBox width={65} height={14} />
    </View>

    {/* History List Items */}
    {[1, 2, 3, 4, 5].map((key) => (
      <View
        key={key}
        className="rounded-2xl border-[1.5px] border-subtle-border bg-card p-3.5 flex-row justify-between items-center">
        <View className="flex-row items-center gap-3 flex-1">
          <SkeletonBox width={40} height={40} borderRadius={12} />
          <View className="gap-1.5 flex-1">
            <SkeletonBox width="60%" height={16} />
            <SkeletonBox width="40%" height={13} />
          </View>
        </View>
        <SkeletonBox width={70} height={24} borderRadius={12} />
      </View>
    ))}
  </View>
);
