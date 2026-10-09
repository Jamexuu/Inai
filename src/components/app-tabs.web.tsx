import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot className="h-full" />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Today</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Medicines</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} className="active:opacity-70">
      <View
        className={`py-2 px-4 rounded-xl ${
          isFocused ? 'bg-sage' : 'bg-surface'
        }`}>
        <Text
          className={`text-[15px] font-semibold ${
            isFocused ? 'text-white' : 'text-umber'
          }`}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View className="absolute bottom-0 w-full p-3 justify-center items-center flex-row">
      <View className="py-2 px-4 rounded-2xl border-[1.5px] border-subtle-border bg-card flex-row items-center justify-between flex-grow max-w-[500px] shadow-sm">
        <View className="flex-row items-center gap-1.5">
          <MaterialCommunityIcons name="pill" size={20} color="#3D5A50" />
          <Text className="text-lg font-bold tracking-wide text-charcoal">
            Inai
          </Text>
        </View>

        <View className="flex-row gap-2">
          {props.children}
        </View>
      </View>
    </View>
  );
}
