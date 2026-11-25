// The bar over a page that isn't a tab (a series, Settings, Add, a price
// page): the way back, the page's name, and a button or two on the right,
// with the double rule under it. On an iPhone or iPad it's Apple's own
// navigation bar (its back button, the swipe from the edge, the name in
// the app's lettering), so every page goes back the same way. Android
// keeps the app's own bar, as its pages have it
import { Stack, router } from "expo-router";
import type { ReactNode } from "react";
import { Platform, Text, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";
import DoubleRule from "@/components/DoubleRule";
import Tap from "@/components/Tap";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { themeOf, useWornTheme } from "@/lib/mangaThemes";

const IOS = Platform.OS === "ios";
const BRAND_FONT = "Bangers_400Regular";

// the safe area a page with this bar keeps clear at its top: none on an
// iPhone or iPad, where Apple's bar already sits below the status bar
export const BAR_EDGES: Edge[] = IOS ? [] : ["top"];

export default function AppBar({
  title,
  right,
  onBack,
  backLabel = "Back",
  padRight = false,
  tight = false,
}: {
  // "" while the page shows its name itself (a series, until scrolled past)
  title: string;
  right?: ReactNode;
  // Android's back, when leaving needs asking first; on an iPhone the page
  // guards its leaving itself (usePreventRemove), which Apple's back and
  // the swipe both go through
  onBack?: () => void;
  backLabel?: string;
  // Android: room at the right of the bar after the button (as the price
  // pages keep beside their bag)
  padRight?: boolean;
  // Android: the series page sets its bar a little tighter
  tight?: boolean;
}) {
  const c = useColors();
  const worn = useWornTheme();
  if (IOS)
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            // (a blank after it: the lettering leans, and its last letter
            // would be cut at the title's edge. A blank, not a space, which
            // Apple's bar trims off)
            title: title ? `${title.toUpperCase()}\u2800` : "",
            headerTitleAlign: "left",
            headerLargeTitle: false,
            headerTransparent: false,
            headerStyle: { backgroundColor: c.paper },
            headerTintColor: c.ink,
            headerTitleStyle: {
              color: c.ink,
              fontFamily: worn ? themeOf(worn)!.font : BRAND_FONT,
              fontSize: 22,
            },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            headerRight: right ? () => right : undefined,
          }}
        />
        <DoubleRule />
      </>
    );
  return (
    <>
      <View
        className={`min-h-[62px] flex-row items-center px-2 ${tight ? "gap-2" : "gap-3"}`}
      >
        <Tap
          feel="round"
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          className="p-2"
          accessibilityLabel={backLabel}
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Tap>
        <Text
          numberOfLines={1}
          className="flex-1 font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase"
        >
          {title}
          {" "}
        </Text>
        {right && padRight ? <View className="pr-2">{right}</View> : right}
      </View>
      <DoubleRule />
    </>
  );
}
