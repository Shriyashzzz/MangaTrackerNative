// The top of a tab's screen. On an iPhone or iPad it's Apple's own
// navigation bar: a large title that shrinks to a small one as the page
// scrolls, lettered in Bangers so the brand stays, with the tab's buttons on
// the right (components/AppHeader.tsx). On Android there's no system bar
// here: the app's own masthead is drawn instead, as before
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Stack } from "expo-router";
import type { ComponentProps } from "react";

export const IOS = Platform.OS === "ios";

type StackOptions = NonNullable<ComponentProps<typeof Stack>["screenOptions"]>;
type Options = Exclude<StackOptions, (...args: never[]) => unknown>;

export function tabHeaderOptions(c: { paper: string; ink: string }): Options {
  if (!IOS) return { headerShown: false };
  return {
    headerShown: true,
    // the bar holds only the tab's buttons: the page letters its own title
    headerLargeTitle: false,
    headerTransparent: false,
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerStyle: { backgroundColor: c.paper },
    headerLargeStyle: { backgroundColor: c.paper },
    headerTintColor: c.ink,
    headerTitleStyle: {
      fontFamily: "Bangers_400Regular",
      fontSize: 22,
      color: c.ink,
    },
    headerLargeTitleStyle: {
      fontFamily: "Bangers_400Regular",
      fontSize: 38,
      color: c.ink,
    },
  };
}

// The room a tab page keeps under its last line. On an iPhone the tab bar
// floats over the foot of the page (it doesn't push the page up, as
// Android's does), so the page scrolls on far enough for its end to come
// clear of it: the home bar, the floating bar, and a little air. Android
// keeps the room each page asks for
const FLOATING_BAR = 50;
// on an iPad the bar sits along the top instead, so the foot only needs air
const AIR = 16;

// An iPad at full width (or most of it) has its tab bar along the top of the
// screen. In a narrow window beside another app it moves back to the foot,
// as on an iPhone
const REGULAR_FROM = 700;
export function useTabsOnTop() {
  const { width } = useWindowDimensions();
  return Platform.OS === "ios" && Platform.isPad && width >= REGULAR_FROM;
}

// `above`: room for something that floats over the bar as well (the
// shelf's + button)
export function useTabFoot(androidRoom: number, above = 0) {
  const insets = useSafeAreaInsets();
  const onTop = useTabsOnTop();
  if (!IOS) return androidRoom;
  return insets.bottom + (onTop ? AIR : FLOATING_BAR) + above;
}
