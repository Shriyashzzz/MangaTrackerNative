// The three halves of the app along the bottom: My shelf, New, Prices (or
// My shelf, Prices, Sign in for someone without an account). The
// tab bar is the platform's own (Expo Router's native tabs): Material 3 on
// Android, UIKit's on an iPhone, with the system's icons for each
import { NativeTabs } from "expo-router/native-tabs";
import { useEffect } from "react";
import { Platform } from "react-native";
import { editionReleases } from "@/core/lib/editionNews";
import { countNew } from "@/core/lib/releaseMath";
import { useColors } from "@/lib/colors";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";

export default function TabsLayout() {
  const c = useColors();
  // the account's settings, once they're signed in
  const loadPrefs = usePrefs((s) => s.load);
  const isSignedIn = Boolean(useAuth((s) => s.isSignedIn));
  useEffect(() => {
    if (isSignedIn) void loadPrefs();
  }, [isSignedIn, loadPrefs]);
  // New's badge: the series with news, as the web's bar counts them
  const manga = useShelf((st) => st.manga);
  const releases = useShelf((st) => st.releases);
  const newCount = manga
    ? countNew(manga, editionReleases(manga, releases))
    : 0;

  return (
    <NativeTabs
      tintColor={c.accentInk}
      iconColor={{ default: c.inkSoft, selected: c.accentInk }}
      labelStyle={{ default: { color: c.inkSoft }, selected: { color: c.ink } }}
      // Android draws the bar in the page's paper; the iPhone keeps its own
      // blur over the page
      backgroundColor={Platform.OS === "android" ? c.paper : undefined}
      blurEffect="systemChromeMaterial"
      rippleColor={`${c.accent}22`}
      indicatorColor={`${c.accent}33`}
      badgeBackgroundColor={c.accent}
      badgeTextColor={c.onAccent}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{ default: "books.vertical", selected: "books.vertical.fill" }}
          md="shelves"
        />
        <NativeTabs.Trigger.Label>My shelf</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* New is an account's; without one the third tab is Sign in */}
      <NativeTabs.Trigger name="new" hidden={!isSignedIn}>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bell", selected: "bell.fill" }}
          md="notifications"
        />
        <NativeTabs.Trigger.Label>New</NativeTabs.Trigger.Label>
        {newCount > 0 ? (
          <NativeTabs.Trigger.Badge>
            {String(newCount)}
          </NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="prices">
        <NativeTabs.Trigger.Icon
          sf={{ default: "tag", selected: "tag.fill" }}
          md="sell"
        />
        <NativeTabs.Trigger.Label>Prices</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account" hidden={isSignedIn}>
        <NativeTabs.Trigger.Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label>Sign in</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
