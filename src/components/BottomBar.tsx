// The bottom bar, as the Android app's (web Header.tsx and index.css "the
// bottom bar as Android's navigation bar"): an icon over each label, a soft
// pill behind the open one's icon, 80px tall over the phone's own swipe strip
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellIcon, ShelfIcon, TagIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import DoubleRule from "./DoubleRule";

const TABS: Record<string, { label: string; Icon: typeof ShelfIcon }> = {
  index: { label: "My shelf", Icon: ShelfIcon },
  new: { label: "New", Icon: BellIcon },
  prices: { label: "Prices", Icon: TagIcon },
};

// what Expo Router's tabs hand their bar
type BarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export default function BottomBar({ state, navigateToTab }: BarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-paper" style={{ paddingBottom: insets.bottom }}>
      <DoubleRule />
      <View className="h-20 flex-row">
        {state.routes.map((route, i) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const open = state.index === i;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: open }}
              onPress={() => {
                if (!open) navigateToTab(route.key);
              }}
              className="flex-1 items-center gap-1 pt-2 pb-3.5"
            >
              <View
                className={`h-8 w-16 items-center justify-center rounded-[16px] ${open ? "bg-accent/20" : ""}`}
              >
                <tab.Icon
                  color={open ? c.accentInk : c.inkSoft}
                  width={24}
                  height={24}
                />
              </View>
              <Text
                className={`font-brand text-[15px] tracking-[1px] uppercase ${open ? "text-ink" : "text-ink-soft"}`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
