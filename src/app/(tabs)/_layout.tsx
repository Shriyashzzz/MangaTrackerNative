// The three halves of the app along the bottom: My shelf, New, Prices (or
// My shelf, Prices, Sign in for someone without an account). The
// tab bar is the platform's own (Expo Router's native tabs): Material 3 on
// Android, UIKit's on an iPhone, with the system's icons for each
import { useAccount } from "@/store/account";
import { avatarTabIcon } from "@/lib/avatarTabIcons";
import { useToBuy } from "@/store/toBuy";
import { IOS } from "@/lib/tabHeader";
import { useTour } from "@/store/tour";
import { router, usePathname } from "expo-router";
import { NativeTabs } from "expo-router/native-tabs";
import { useEffect } from "react";
import { Platform } from "react-native";
import { editionReleases } from "@/core/lib/editionNews";
import { countNew } from "@/core/lib/releaseMath";
import { useColors } from "@/lib/colors";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";

// whether the app has been opened this run (the effect below runs once)
let openedOnce = false;

export default function TabsLayout() {
  const c = useColors();
  const touring = useTour((tour) => tour.steps.length > 0);
  // the account's settings, once they're signed in
  const loadPrefs = usePrefs((s) => s.load);
  const isSignedIn = Boolean(useAuth((s) => s.isSignedIn));
  useEffect(() => {
    if (isSignedIn) void loadPrefs();
  }, [isSignedIn, loadPrefs]);
  // Opened with no account: it starts on Prices, the half of the app that
  // works without one (the shelf is an account's). Once, as the app opens,
  // and only from the app's own front door: a link to some other page goes
  // where it says, and signing out later leaves them where they are
  const path = usePathname();
  useEffect(() => {
    if (openedOnce) return;
    openedOnce = true;
    if (!isSignedIn && path === "/") router.replace("/prices");
    // only as the app opens: not again when they sign out or move about
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // New's badge: the series with news, as the web's bar counts them
  const manga = useShelf((st) => st.manga);
  const releases = useShelf((st) => st.releases);
  const toBuyCount = useToBuy((st) => st.list?.items.length ?? 0);
  const avatarId = useAccount((st) => st.account?.avatar);
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
      // On iPad the tabs are a sidebar down the left, as Apple's own iPad
      // apps have them, rather than a bar floating over the top of the page.
      // A phone keeps its bar along the foot
      sidebarAdaptable
      preferredPlacement="sidebar"
    >
      <NativeTabs.Trigger name="(shelf)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "books.vertical", selected: "books.vertical.fill" }}
          md="shelves"
        />
        <NativeTabs.Trigger.Label>My shelf</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* New is an account's; without one the third tab is Sign in */}
      <NativeTabs.Trigger name="(new)" hidden={!isSignedIn}>
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
      {/* while Kenji's tour is on, only he opens price pages: wandering into
          Prices mid-tour loses the thread (pressing the tab does nothing) */}
      <NativeTabs.Trigger name="(prices)" disabled={touring}>
        <NativeTabs.Trigger.Icon
          sf={{ default: "tag", selected: "tag.fill" }}
          md="sell"
        />
        <NativeTabs.Trigger.Label>Prices</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* on an iPhone, To buy and Me are tabs: nothing sits on top of the
          pages (Android keeps the bag and the menu in its masthead) */}
      <NativeTabs.Trigger name="(tobuy)" hidden={!IOS}>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bag", selected: "bag.fill" }}
          md="shopping_bag"
        />
        <NativeTabs.Trigger.Label>To buy</NativeTabs.Trigger.Label>
        {toBuyCount > 0 ? (
          <NativeTabs.Trigger.Badge>
            {String(toBuyCount)}
          </NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>
      {/* Me is an account's: signed out, there's none */}
      <NativeTabs.Trigger name="(me)" hidden={!IOS || !isSignedIn}>
        {/* their own picture, in colour; signed out, a person */}
        {isSignedIn ? (
          <NativeTabs.Trigger.Icon
            src={avatarTabIcon(avatarId)}
            renderingMode="original"
          />
        ) : (
          <NativeTabs.Trigger.Icon
            sf={{
              default: "person.crop.circle",
              selected: "person.crop.circle.fill",
            }}
            md="person"
          />
        )}
        <NativeTabs.Trigger.Label>Me</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* (Signing in is an action, not a place: the shelf's welcome and
          the header's Sign in button lead to it, as Apple's tabs are
          places only. A hidden tab beside a hidden New threw the bar's
          taps out by one, so there is no Sign in tab at all) */}
    </NativeTabs>
  );
}
