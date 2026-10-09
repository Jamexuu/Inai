import React from 'react';
import { Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightElement,
}) => {
  return (
    <View className="flex-row justify-between items-end mb-3 mt-4">
      <View className="flex-1 gap-0.5">
        <Text className="text-[22px] font-bold tracking-wide text-charcoal">
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-[15px] font-medium text-umber">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
    </View>
  );
};
