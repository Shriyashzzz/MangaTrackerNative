// The bottom bar, as the Android app's (web Header.tsx and index.css "the
// bottom bar as Android's navigation bar"): an icon over each label, a soft
// pill behind the open one's icon, 80px tall over the phone's own swipe strip
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BellIcon, ShelfIcon, TagIcon } from "@/core/components/icons/Icons";
import { editionReleases } from "@/core/lib/editionNews";
import { countNew } from "@/core/lib/releaseMath";
import { useColors } from "@/lib/colors";
import { useShelf } from "@/store/shelf";
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
  // New's badge: the series with news, as the web's bar counts them
  const manga = useShelf((st) => st.manga);
  const releases = useShelf((st) => st.releases);
  const newCount = manga
    ? countNew(manga, editionReleases(manga, releases))
    : 0;
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
                {route.name === "new" && newCount > 0 ? (
                  <View className="absolute -top-[3px] left-[38px] h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-accent px-[5px]">
                    <Text className="font-body-semibold text-[11px] text-on-accent">
                      {newCount}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                className={`font-brand pr-1 text-[15px] tracking-[1px] uppercase ${open ? "text-ink" : "text-ink-soft"}`}
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
