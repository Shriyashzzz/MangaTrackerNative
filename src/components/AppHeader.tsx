// The top bar, as the Android app's masthead (web layouts/header): the logo
// and name, To buy's bag with how many are on the list, and their picture,
// which opens the menu (SettingsMenu), over a double rule
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { LOGO_SVG } from "@/core/assets/logo";
import { BagIcon } from "@/core/components/icons/Icons";
import { useHasYear } from "@/core/lib/year";
import { useColors } from "@/lib/colors";
import { useAccount } from "@/store/account";
import { useAuth } from "@/store/auth";
import { loadToBuyOnce, useToBuy } from "@/store/toBuy";
import Avatar from "./Avatar";
import DoubleRule from "./DoubleRule";
import SettingsMenu from "./SettingsMenu";

export default function AppHeader() {
  const c = useColors();
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const account = useAccount((s) => s.account);
  const loadAccount = useAccount((s) => s.load);
  const toBuyCount = useToBuy((s) => s.list?.items.length ?? 0);
  const hasYear = useHasYear(Boolean(isSignedIn));
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (isSignedIn) {
      if (!account) void loadAccount();
      loadToBuyOnce();
    }
  }, [isSignedIn, account, loadAccount]);
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
        {isSignedIn ? (
          <>
            <Pressable
              onPress={() => router.push("/to-buy")}
              hitSlop={8}
              accessibilityLabel={`To buy${toBuyCount ? `, ${toBuyCount} on the list` : ""}`}
              className="p-1"
            >
              <BagIcon color={c.inkSoft} width={24} height={24} />
              {toBuyCount ? (
                <View className="absolute -top-1 -right-1 min-w-[18px] items-center rounded-full border border-paper bg-accent px-1">
                  <Text className="font-mono-medium text-[10px] text-on-accent">
                    {toBuyCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => setMenuOpen(true)}
              hitSlop={8}
              accessibilityLabel="Menu"
            >
              <Avatar id={account?.avatar} size={36} />
            </Pressable>
          </>
        ) : null}
      </View>
      <DoubleRule />
      <SettingsMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        hasYear={hasYear}
      />
    </View>
  );
}
