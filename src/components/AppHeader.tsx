// The top bar, as the Android app's masthead (web layouts/header): the logo
// and name, To buy's bag with how many are on the list, and their picture,
// which opens the menu (SettingsMenu), over a double rule
import { useColors } from "@/lib/colors";
import { IOS } from "@/lib/tabHeader";
import { router, Stack } from "expo-router";
import Tap from "@/components/Tap";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
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
  const c = useColors();
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
  // iOS: Apple's bar draws the top (lib/tabHeader.ts). Signed in, the To buy
  // bag and their picture are its buttons; signed out, Sign in is
  if (IOS)
    return (
      <>
        <Stack.Screen
          options={{
            // no title in Apple's bar: the page letters its own, in the
            // app's style (iOS clipped Bangers in its bar)
            title: "",
            headerTitle: () => null,
            // signed out: Apple's own text button, with the room and the
            // press feel a bar button has
            // Each is its own item in Apple's bar, apart from the other:
            // To buy's bag in its own round button, their picture on its own
            // with no button behind it. Signed out: Apple's text button
            unstable_headerRightItems: () =>
              isSignedIn
                ? [
                    {
                      type: "custom",
                      element: (
                        <Tap
                          onPress={() => setMenuOpen(true)}
                          hitSlop={8}
                          accessibilityLabel="Menu"
                        >
                          <Avatar id={account?.avatar} size={34} />
                        </Tap>
                      ),
                      hidesSharedBackground: true,
                    },
                    { type: "spacing", spacing: 10 },
                    { type: "custom", element: <ToBuyBag /> },
                  ]
                : [
                    {
                      type: "button",
                      label: "Sign in",
                      onPress: () => router.push("/sign-in"),
                      tintColor: c.accentInk,
                      labelStyle: { fontWeight: "600" },
                    },
                  ],
          }}
        />
        {menu}
      </>
    );
  return (
    <View className="bg-paper">
      <View className="h-[62px] flex-row items-center gap-3 px-4">
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
        {/* signed out: Sign in, now that it isn't a tab */}
        {!isSignedIn ? (
          <Tap
            onPress={() => router.push("/sign-in")}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text className="font-body-semibold text-[15px] text-accent-ink">
              Sign in
            </Text>
          </Tap>
        ) : null}
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
