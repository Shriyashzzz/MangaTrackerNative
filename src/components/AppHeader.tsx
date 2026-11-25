// The top bar, as the Android app's masthead (web layouts/header): the logo
// and name, To buy's bag with how many are on the list, and their picture,
// which opens the menu (SettingsMenu), over a double rule

import { IOS } from "@/lib/tabHeader";
import { Stack } from "expo-router";
import Tap from "@/components/Tap";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { LOGO_SVG } from "@/core/assets/logo";
import { useHasYear } from "@/core/lib/year";
import { useAccount } from "@/store/account";
import { useAuth } from "@/store/auth";
import Avatar from "./Avatar";
import DoubleRule from "./DoubleRule";
import SettingsMenu from "./SettingsMenu";
import ToBuyBag from "./ToBuyBag";

export default function AppHeader({
  // the tab's name, as Apple's large title says it on iOS
  title,
}: {
  title: string;
}) {
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const insets = useSafeAreaInsets();
  const account = useAccount((s) => s.account);
  const loadAccount = useAccount((s) => s.load);
  const hasYear = useHasYear(Boolean(isSignedIn));
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (isSignedIn) {
      if (!account) void loadAccount();
    }
  }, [isSignedIn, account, loadAccount]);
  const menu = (
    <SettingsMenu
      open={menuOpen}
      onClose={() => setMenuOpen(false)}
      hasYear={hasYear}
    />
  );
  // iOS: no bar of its own. To buy and the menu are tabs there (To buy and
  // Me), so the page's own title is the top; here only room for the
  // status bar
  if (IOS)
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={{ height: insets.top }} />
      </>
    );
  return (
    <View className="bg-paper">
      <View className="min-h-[62px] flex-row items-center gap-3 px-4">
        <View className="mr-auto flex-row items-center gap-2">
          <SvgXml xml={LOGO_SVG} width={30} height={30} />
          <Text
            numberOfLines={1}
            className="font-brand pr-[6px] text-[26px] tracking-[1px] text-ink uppercase"
          >
            Manga Tracker
            {"\u00A0"}
          </Text>
        </View>
        {/* the list and the menu are an account's: nothing to open without one */}

        {isSignedIn ? (
          <>
            <ToBuyBag />
            <Tap
              onPress={() => setMenuOpen(true)}
              hitSlop={8}
              accessibilityLabel="Menu"
            >
              <Avatar id={account?.avatar} size={36} />
            </Tap>
          </>
        ) : null}
      </View>
      <DoubleRule />
      {menu}
    </View>
  );
}
