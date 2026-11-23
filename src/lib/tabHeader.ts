// The top of a tab's screen. On an iPhone or iPad it's Apple's own
// navigation bar: a large title that shrinks to a small one as the page
// scrolls, lettered in Bangers so the brand stays, with the tab's buttons on
// the right (components/AppHeader.tsx). On Android there's no system bar
// here: the app's own masthead is drawn instead, as before
import { Platform } from "react-native";
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
